import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAccountTools } from "../dist/tools/account.js";
import { registerEventTools } from "../dist/tools/events.js";
import { registerReportTools } from "../dist/tools/reports.js";
import { registerSessionTools } from "../dist/tools/sessions.js";
import { registerUserTools } from "../dist/tools/users.js";
import { registerV3Tools } from "../dist/tools/v3.js";

const websiteId = "00000000-0000-4000-8000-000000000001";

test("MCP tools use current Umami v3 methods, paths, payloads, and auth policies", async () => {
  const calls = [];
  const mockClient = {
    async call(...args) {
      calls.push(args);
      if (args[1] === "/api/batch") {
        return {
          size: 1,
          processed: 0,
          errors: 1,
          details: [{ index: 0, response: { error: "invalid event" } }],
        };
      }
      return { ok: true };
    },
    async completeTwoFactorLogin() {
      return { ok: true };
    },
  };
  const mcpServer = new McpServer({ name: "routes-test", version: "1.0.0" });
  registerEventTools(mcpServer, mockClient);
  registerReportTools(mcpServer, mockClient);
  registerAccountTools(mcpServer, mockClient);
  registerUserTools(mcpServer, mockClient);
  registerSessionTools(mcpServer, mockClient);
  registerV3Tools(mcpServer, mockClient);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "routes-test-client", version: "1.0.0" });

  try {
    await Promise.all([mcpServer.connect(serverTransport), client.connect(clientTransport)]);
    await client.callTool({
      name: "send_event",
      arguments: { websiteId, hostname: "example.com", url: "/" },
    });
    const batchResult = await client.callTool({
      name: "batch_events",
      arguments: { events: [{ websiteId, hostname: "example.com", url: "/" }] },
    });
    await client.callTool({ name: "list_reports", arguments: { websiteId } });
    await client.callTool({ name: "verify_auth", arguments: {} });
    await client.callTool({ name: "list_users", arguments: {} });
    const replayResult = await client.callTool({
      name: "get_replay",
      arguments: { websiteId, replayId: "visit/id" },
    });
    await client.callTool({
      name: "get_session_activity",
      arguments: { websiteId, sessionId: "session-id", startAt: 1000, endAt: 2000 },
    });

    const event = calls.find(([, path]) => path === "/api/send");
    assert.deepEqual(event, [
      "POST",
      "/api/send",
      {
        type: "event",
        payload: { website: websiteId, hostname: "example.com", url: "/" },
      },
      undefined,
      { auth: "none", target: "collector" },
    ]);

    const batch = calls.find(([, path]) => path === "/api/batch");
    assert.ok(Array.isArray(batch[2]));
    assert.equal(batch[2][0].type, "event");
    assert.deepEqual(batch[4], { auth: "none", target: "collector" });
    assert.equal(batchResult.isError, true);
    assert.equal(JSON.parse(batchResult.content[0].text).errors, 1);

    assert.ok(calls.some(([method, path]) => method === "POST" && path === "/api/auth/verify"));
    assert.ok(calls.some(([method, path]) => method === "GET" && path === "/api/admin/users"));
    assert.deepEqual(JSON.parse(replayResult.content[0].text), { ok: true });
    assert.ok(
      calls.some(
        ([method, path]) =>
          method === "GET" &&
          path === `/api/websites/${websiteId}/replays/visit%2Fid`,
      ),
    );
    assert.ok(
      calls.some(
        ([method, path, , query]) =>
          method === "GET" && path === "/api/reports" && query.websiteId === websiteId,
      ),
    );
    assert.ok(
      calls.some(
        ([method, path, , query]) =>
          method === "GET" &&
          path === `/api/websites/${websiteId}/sessions/session-id/activity` &&
          query.startAt === 1000 &&
          query.endAt === 2000,
      ),
    );
  } finally {
    await client.close();
    await mcpServer.close();
  }
});

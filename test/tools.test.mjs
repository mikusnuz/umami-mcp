import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("advertises current v3 tools and required contract fields", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["dist/index.js"],
    cwd: process.cwd(),
    stderr: "pipe",
  });
  const client = new Client({ name: "umami-mcp-test", version: "1.0.0" });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool]));

    for (const name of [
      "list_boards",
      "list_links",
      "list_pixels",
      "get_two_factor_status",
      "list_segments",
      "list_replays",
      "get_replay_saved_status",
      "export_website",
      "get_revenue_stats",
      "send_performance",
      "get_event_data_properties",
      "get_user_two_factor_status",
    ]) {
      assert.ok(byName.has(name), `missing ${name}`);
    }
    assert.equal(byName.has("get_user_usage"), false);
    assert.equal(byName.has("add_team_website"), false);
    assert.ok(byName.get("list_reports").inputSchema.required.includes("websiteId"));
    assert.ok(byName.get("get_session_activity").inputSchema.required.includes("startAt"));
    assert.ok(byName.get("get_session_activity").inputSchema.required.includes("endAt"));
    assert.ok(byName.get("get_event_values").inputSchema.required.includes("type"));
    assert.ok(byName.get("get_event_series").inputSchema.required.includes("timezone"));
    assert.ok(
      byName.get("get_event_data_values").inputSchema.required.includes("propertyName"),
    );
    assert.deepEqual(
      byName.get("get_metrics").inputSchema.properties.type.enum.includes("screen"),
      true,
    );
    assert.deepEqual(
      byName.get("get_metrics").inputSchema.properties.type.enum.includes("distinctId"),
      true,
    );
  } finally {
    await client.close();
  }
});

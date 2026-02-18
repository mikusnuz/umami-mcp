import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

export function registerSessionTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "get_session",
    "Get details of a specific session",
    {
      websiteId: z.string().describe("Website UUID"),
      sessionId: z.string().describe("Session UUID"),
    },
    async ({ websiteId, sessionId }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/sessions/${sessionId}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_session_activity",
    "Get activity log for a specific session (pages visited, events fired)",
    {
      websiteId: z.string().describe("Website UUID"),
      sessionId: z.string().describe("Session UUID"),
    },
    async ({ websiteId, sessionId }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/sessions/${sessionId}/activity`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_session_properties",
    "Get custom properties attached to a specific session",
    {
      websiteId: z.string().describe("Website UUID"),
      sessionId: z.string().describe("Session UUID"),
    },
    async ({ websiteId, sessionId }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/sessions/${sessionId}/properties`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

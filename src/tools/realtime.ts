import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

export function registerRealtimeTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "get_realtime",
    "Get real-time data for a website (last 30 minutes). Returns current visitors, active URLs, referrers, countries, and events.",
    {
      websiteId: z.string().describe("Website UUID"),
    },
    async ({ websiteId }) => {
      const data = await client.call("GET", `/api/realtime/${websiteId}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

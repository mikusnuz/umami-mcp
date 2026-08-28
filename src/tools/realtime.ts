import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

export function registerRealtimeTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "get_realtime",
    "Get real-time data for a website (last 30 minutes). Returns current visitors, active URLs, referrers, countries, and events.",
    {
      websiteId: z.string().describe("Website UUID"),
      timezone: z.string().optional().describe("IANA timezone"),
      unit: z.enum(["minute", "hour", "day", "month", "year"]).optional(),
      path: z.string().optional(),
      event: z.string().optional(),
      country: z.string().optional(),
      device: z.string().optional(),
    },
    async ({ websiteId, timezone, unit, path, event, country, device }) => {
      const data = await client.call("GET", `/api/realtime/${websiteId}`, undefined, {
        timezone,
        unit,
        path,
        event,
        country,
        device,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

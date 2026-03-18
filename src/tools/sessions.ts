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

  server.tool(
    "get_session_data_properties",
    "Get session data property names and their data types for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
    },
    async ({ websiteId, startAt, endAt }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/session-data/properties`,
        undefined,
        { startAt, endAt }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_session_data_values",
    "Get session data values (aggregated counts for session properties) for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
      propertyName: z.string().optional().describe("Filter by property name"),
    },
    async ({ websiteId, startAt, endAt, propertyName }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/session-data/values`,
        undefined,
        { startAt, endAt, propertyName }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

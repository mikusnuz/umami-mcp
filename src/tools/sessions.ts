import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

const filtersSchema = z
  .record(z.union([z.string(), z.number(), z.boolean()]))
  .optional()
  .describe("Additional current Umami filter fields");

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
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
      distinctId: z.string().optional().describe("Optional linked distinct ID"),
    },
    async ({ websiteId, sessionId, startAt, endAt, distinctId }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/sessions/${sessionId}/activity`,
        undefined,
        { startAt, endAt, distinctId },
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
      propertyName: z.string().optional().describe("Optional property name"),
      filters: filtersSchema,
    },
    async ({ websiteId, startAt, endAt, propertyName, filters }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/session-data/properties`,
        undefined,
        { ...filters, startAt, endAt, propertyName }
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
      dataType: z.number().int().optional().describe("Optional Umami data type code"),
      filters: filtersSchema,
    },
    async ({ websiteId, startAt, endAt, propertyName, dataType, filters }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/session-data/values`,
        undefined,
        { ...filters, startAt, endAt, propertyName, dataType }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

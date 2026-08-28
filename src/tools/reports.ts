import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

const reportType = z.enum([
  "attribution",
  "breakdown",
  "funnel",
  "goal",
  "heatmap",
  "journey",
  "performance",
  "retention",
  "revenue",
  "utm",
]);

export function registerReportTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "list_reports",
    "List saved reports for a website",
    {
      websiteId: z.string().uuid().describe("Website UUID"),
      type: reportType.optional().describe("Optional report type filter"),
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
    },
    async ({ websiteId, type, page, pageSize }) => {
      const data = await client.call("GET", "/api/reports", undefined, {
        websiteId,
        type,
        page,
        pageSize,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_report",
    "Get details of a specific saved report",
    {
      reportId: z.string().uuid().describe("Report UUID"),
    },
    async ({ reportId }) => {
      const data = await client.call("GET", `/api/reports/${reportId}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_report",
    "Create and save a new report",
    {
      websiteId: z.string().uuid().describe("Website UUID"),
      name: z.string().max(200).describe("Report name"),
      type: reportType.describe("Report type"),
      description: z.string().max(500).optional().describe("Report description"),
      parameters: z
        .record(z.unknown())
        .describe("Report-specific parameters (JSON object)"),
    },
    async ({ websiteId, name, type, description, parameters }) => {
      const body: Record<string, unknown> = { websiteId, name, type };
      if (description) body.description = description;
      body.parameters = parameters;
      const data = await client.call("POST", "/api/reports", body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_report",
    "Update an existing saved report",
    {
      reportId: z.string().uuid().describe("Report UUID"),
      websiteId: z.string().uuid().describe("Website UUID"),
      name: z.string().max(200).describe("Report name"),
      type: reportType.describe("Report type"),
      description: z.string().max(500).optional().describe("Report description"),
      parameters: z
        .record(z.unknown())
        .describe("Report-specific parameters (JSON object)"),
    },
    async ({ reportId, websiteId, name, type, description, parameters }) => {
      const body: Record<string, unknown> = { websiteId, name, type, parameters };
      if (description !== undefined) body.description = description;
      const data = await client.call("POST", `/api/reports/${reportId}`, body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_report",
    "Delete a saved report",
    {
      reportId: z.string().uuid().describe("Report UUID to delete"),
    },
    async ({ reportId }) => {
      await client.call("DELETE", `/api/reports/${reportId}`);
      return { content: [{ type: "text", text: `Report ${reportId} deleted successfully.` }] };
    }
  );

  server.tool(
    "run_report",
    "Execute a current Umami v3 report and return its result",
    {
      type: reportType.describe("Report type to run"),
      websiteId: z.string().uuid().describe("Website UUID"),
      filters: z
        .record(z.unknown())
        .default({})
        .describe("Current Umami filter object; use {} for no filters"),
      parameters: z
        .record(z.unknown())
        .describe("Report-specific parameters (varies by type)"),
    },
    async ({ type, websiteId, filters, parameters }) => {
      const body: Record<string, unknown> = { websiteId, type, filters, parameters };
      const data = await client.call("POST", `/api/reports/${type}`, body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

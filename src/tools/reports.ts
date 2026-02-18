import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

export function registerReportTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "list_reports",
    "List all saved reports",
    {
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      orderBy: z.string().optional().describe("Field to order by"),
    },
    async ({ page, pageSize, orderBy }) => {
      const data = await client.call("GET", "/api/reports", undefined, {
        page,
        pageSize,
        orderBy,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_report",
    "Get details of a specific saved report",
    {
      reportId: z.string().describe("Report UUID"),
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
      websiteId: z.string().describe("Website UUID"),
      name: z.string().describe("Report name"),
      type: z
        .enum(["funnel", "retention", "utm", "goals", "insights", "revenue", "journey"])
        .describe("Report type"),
      description: z.string().optional().describe("Report description"),
      parameters: z
        .record(z.unknown())
        .optional()
        .describe("Report-specific parameters (JSON object)"),
    },
    async ({ websiteId, name, type, description, parameters }) => {
      const body: Record<string, unknown> = { websiteId, name, type };
      if (description) body.description = description;
      if (parameters) body.parameters = parameters;
      const data = await client.call("POST", "/api/reports", body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "run_report",
    "Execute a report by type and get results (funnel, retention, utm, goals, insights, revenue, journey)",
    {
      type: z
        .enum(["funnel", "retention", "utm", "goals", "insights", "revenue", "journey"])
        .describe("Report type to run"),
      websiteId: z.string().describe("Website UUID"),
      parameters: z
        .record(z.unknown())
        .describe("Report-specific parameters (varies by type)"),
    },
    async ({ type, websiteId, parameters }) => {
      const body: Record<string, unknown> = { websiteId, ...parameters };
      const data = await client.call("POST", `/api/reports/${type}`, body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

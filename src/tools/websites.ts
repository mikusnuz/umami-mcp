import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

export function registerWebsiteTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "list_websites",
    "List all websites tracked in Umami",
    {
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page (default 10)"),
      search: z.string().optional().describe("Search query to filter websites"),
      orderBy: z.string().optional().describe("Field to order by (e.g. 'name', 'domain')"),
      sortDescending: z.boolean().optional(),
      includeTeams: z.boolean().optional().describe("Include team-accessible websites"),
    },
    async ({ page, pageSize, search, orderBy, sortDescending, includeTeams }) => {
      const data = await client.call("GET", "/api/websites", undefined, {
        page: page,
        pageSize: pageSize,
        search,
        orderBy,
        sortDescending,
        includeTeams,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_website",
    "Get details of a specific website by ID",
    {
      websiteId: z.string().describe("Website UUID"),
    },
    async ({ websiteId }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_website",
    "Create a new website to track in Umami",
    {
      domain: z.string().describe("Website domain (e.g. 'example.com')"),
      name: z.string().describe("Display name for the website"),
      shareId: z.string().optional().describe("Unique share ID for public access"),
      teamId: z.string().uuid().optional().describe("Create the website under this team"),
    },
    async ({ domain, name, shareId, teamId }) => {
      const body: Record<string, unknown> = { domain, name };
      if (shareId) body.shareId = shareId;
      if (teamId) body.teamId = teamId;
      const data = await client.call("POST", "/api/websites", body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_website",
    "Update an existing website's configuration",
    {
      websiteId: z.string().describe("Website UUID"),
      domain: z.string().optional().describe("New domain"),
      name: z.string().optional().describe("New display name"),
      shareId: z.string().nullable().optional().describe("Share ID (set to null to remove)"),
      replayConfig: z
        .object({
          replayEnabled: z.boolean().optional(),
          heatmapEnabled: z.boolean().optional(),
          sampleRate: z.number().min(0).max(1).optional(),
          heatmapSampleRate: z.number().min(0).max(1).optional(),
          maskLevel: z.enum(["strict", "moderate"]).optional(),
          maxDuration: z.number().int().positive().optional(),
          blockSelector: z.string().optional(),
        })
        .optional()
        .describe("Session replay and heatmap collection settings"),
    },
    async ({ websiteId, domain, name, shareId, replayConfig }) => {
      const body: Record<string, unknown> = {};
      if (domain !== undefined) body.domain = domain;
      if (name !== undefined) body.name = name;
      if (shareId !== undefined) body.shareId = shareId;
      if (replayConfig !== undefined) body.replayConfig = replayConfig;
      const data = await client.call("POST", `/api/websites/${websiteId}`, body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_website",
    "Delete a website from Umami",
    {
      websiteId: z.string().describe("Website UUID to delete"),
    },
    async ({ websiteId }) => {
      await client.call("DELETE", `/api/websites/${websiteId}`);
      return { content: [{ type: "text", text: `Website ${websiteId} deleted successfully.` }] };
    }
  );

  server.tool(
    "get_active_visitors",
    "Get the number of currently active visitors on a website",
    {
      websiteId: z.string().describe("Website UUID"),
    },
    async ({ websiteId }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/active`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "reset_website",
    "Reset a website by removing all its analytics data (irreversible)",
    {
      websiteId: z.string().describe("Website UUID to reset"),
    },
    async ({ websiteId }) => {
      await client.call("POST", `/api/websites/${websiteId}/reset`);
      return { content: [{ type: "text", text: `Website ${websiteId} data has been reset.` }] };
    }
  );

  server.tool(
    "transfer_website",
    "Transfer a website to a user or team using the current Umami transfer endpoint",
    {
      websiteId: z.string().describe("Website UUID to transfer"),
      destinationType: z.enum(["user", "team"]),
      destinationId: z.string().uuid().describe("Target user or team UUID"),
    },
    async ({ websiteId, destinationType, destinationId }) => {
      const data = await client.call("POST", `/api/websites/${websiteId}/transfer`,
        destinationType === "user" ? { userId: destinationId } : { teamId: destinationId });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_website_reports",
    "Get all reports associated with a specific website",
    {
      websiteId: z.string().describe("Website UUID"),
    },
    async ({ websiteId }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/reports`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_website_charts",
    "Get chart data for up to 20 websites",
    {
      websiteIds: z.array(z.string().uuid()).min(1).max(20),
      startAt: z.number().int().optional(),
      endAt: z.number().int().optional(),
      timezone: z.string().optional(),
    },
    async ({ websiteIds, startAt, endAt, timezone }) => {
      const data = await client.call("GET", "/api/websites/charts", undefined, {
        ids: websiteIds.join(","),
        startAt,
        endAt,
        timezone,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );
}

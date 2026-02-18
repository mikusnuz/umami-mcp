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
      query: z.string().optional().describe("Search query to filter websites"),
      orderBy: z.string().optional().describe("Field to order by (e.g. 'name', 'domain')"),
    },
    async ({ page, pageSize, query, orderBy }) => {
      const data = await client.call("GET", "/api/websites", undefined, {
        page: page,
        pageSize: pageSize,
        query,
        orderBy,
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
    },
    async ({ domain, name, shareId }) => {
      const body: Record<string, unknown> = { domain, name };
      if (shareId) body.shareId = shareId;
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
      shareId: z.string().optional().describe("Share ID (set to null to remove)"),
    },
    async ({ websiteId, domain, name, shareId }) => {
      const body: Record<string, unknown> = {};
      if (domain !== undefined) body.domain = domain;
      if (name !== undefined) body.name = name;
      if (shareId !== undefined) body.shareId = shareId;
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
}

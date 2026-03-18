import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

export function registerAccountTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "get_me",
    "Get the currently authenticated user's profile information",
    {},
    async () => {
      const data = await client.call("GET", "/api/me");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_my_websites",
    "Get the list of websites belonging to the current user",
    {
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      query: z.string().optional().describe("Search query to filter websites"),
    },
    async ({ page, pageSize, query }) => {
      const data = await client.call("GET", "/api/me/websites", undefined, {
        page,
        pageSize,
        query,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_my_teams",
    "Get the list of teams the current user belongs to",
    {
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      query: z.string().optional().describe("Search query to filter teams"),
    },
    async ({ page, pageSize, query }) => {
      const data = await client.call("GET", "/api/me/teams", undefined, {
        page,
        pageSize,
        query,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_my_password",
    "Update the current user's password",
    {
      currentPassword: z.string().describe("Current password"),
      newPassword: z.string().describe("New password"),
    },
    async ({ currentPassword, newPassword }) => {
      await client.call("POST", "/api/me/password", {
        currentPassword,
        newPassword,
      });
      return { content: [{ type: "text", text: "Password updated successfully." }] };
    }
  );

  server.tool(
    "verify_auth",
    "Verify the current authentication token is valid",
    {},
    async () => {
      const data = await client.call("GET", "/api/auth/verify");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_share",
    "Get shared website data by share ID (public access, no auth required for the share itself)",
    {
      shareId: z.string().describe("The share ID of a publicly shared website"),
    },
    async ({ shareId }) => {
      const data = await client.call("GET", `/api/share/${shareId}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "heartbeat",
    "Check if the Umami server is running and healthy",
    {},
    async () => {
      const data = await client.call("GET", "/api/heartbeat");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

export function registerUserTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "list_users",
    "List all users (admin only)",
    {
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page (default 10)"),
      search: z.string().optional().describe("Search query to filter users"),
      orderBy: z.string().optional().describe("Field to order by (e.g. 'username', 'createdAt')"),
      sortDescending: z.boolean().optional(),
    },
    async ({ page, pageSize, search, orderBy, sortDescending }) => {
      const data = await client.call("GET", "/api/admin/users", undefined, {
        page,
        pageSize,
        search,
        orderBy,
        sortDescending,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_user",
    "Create a new user (admin only)",
    {
      username: z.string().max(255).describe("Username for the new user"),
      password: z.string().min(8).max(255).describe("Password for the new user"),
      role: z.enum(["admin", "user", "view-only"]).describe("User role"),
    },
    async ({ username, password, role }) => {
      const body: Record<string, unknown> = { username, password };
      body.role = role;
      const data = await client.call("POST", "/api/users", body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_user",
    "Get details of a specific user (admin only)",
    {
      userId: z.string().uuid().describe("User UUID"),
    },
    async ({ userId }) => {
      const data = await client.call("GET", `/api/users/${userId}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_user",
    "Update a user's username, password, or role (admin only)",
    {
      userId: z.string().uuid().describe("User UUID"),
      username: z.string().max(255).optional().describe("New username"),
      password: z.string().min(8).max(255).optional().describe("New password"),
      role: z.enum(["admin", "user", "view-only"]).optional().describe("New role"),
    },
    async ({ userId, username, password, role }) => {
      const body: Record<string, unknown> = {};
      if (username !== undefined) body.username = username;
      if (password !== undefined) body.password = password;
      if (role !== undefined) body.role = role;
      const data = await client.call("POST", `/api/users/${userId}`, body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_user",
    "Delete a user (admin only)",
    {
      userId: z.string().uuid().describe("User UUID to delete"),
    },
    async ({ userId }) => {
      await client.call("DELETE", `/api/users/${userId}`);
      return { content: [{ type: "text", text: `User ${userId} deleted successfully.` }] };
    }
  );

  server.tool(
    "get_user_websites",
    "Get the list of websites a user has access to (admin only)",
    {
      userId: z.string().uuid().describe("User UUID"),
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      search: z.string().optional().describe("Search query to filter websites"),
      orderBy: z.string().optional(),
      sortDescending: z.boolean().optional(),
      includeTeams: z.boolean().optional(),
    },
    async ({ userId, page, pageSize, search, orderBy, sortDescending, includeTeams }) => {
      const data = await client.call("GET", `/api/users/${userId}/websites`, undefined, {
        page,
        pageSize,
        search,
        orderBy,
        sortDescending,
        includeTeams,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_user_teams",
    "Get the list of teams a user belongs to (admin only)",
    {
      userId: z.string().uuid().describe("User UUID"),
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      orderBy: z.string().optional(),
      sortDescending: z.boolean().optional(),
    },
    async ({ userId, page, pageSize, orderBy, sortDescending }) => {
      const data = await client.call("GET", `/api/users/${userId}/teams`, undefined, {
        page,
        pageSize,
        orderBy,
        sortDescending,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

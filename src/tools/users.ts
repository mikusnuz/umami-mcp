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
      query: z.string().optional().describe("Search query to filter users"),
      orderBy: z.string().optional().describe("Field to order by (e.g. 'username', 'createdAt')"),
    },
    async ({ page, pageSize, query, orderBy }) => {
      const data = await client.call("GET", "/api/users", undefined, {
        page,
        pageSize,
        query,
        orderBy,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_user",
    "Create a new user (admin only)",
    {
      username: z.string().describe("Username for the new user"),
      password: z.string().describe("Password for the new user"),
      role: z.string().optional().describe("User role: 'admin' or 'user' (default: 'user')"),
    },
    async ({ username, password, role }) => {
      const body: Record<string, unknown> = { username, password };
      if (role) body.role = role;
      const data = await client.call("POST", "/api/users", body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_user",
    "Get details of a specific user (admin only)",
    {
      userId: z.string().describe("User UUID"),
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
      userId: z.string().describe("User UUID"),
      username: z.string().optional().describe("New username"),
      password: z.string().optional().describe("New password"),
      role: z.string().optional().describe("New role: 'admin' or 'user'"),
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
      userId: z.string().describe("User UUID to delete"),
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
      userId: z.string().describe("User UUID"),
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      query: z.string().optional().describe("Search query to filter websites"),
    },
    async ({ userId, page, pageSize, query }) => {
      const data = await client.call("GET", `/api/users/${userId}/websites`, undefined, {
        page,
        pageSize,
        query,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_user_usage",
    "Get usage statistics for a specific user (admin only)",
    {
      userId: z.string().describe("User UUID"),
      startAt: z.number().optional().describe("Start timestamp in milliseconds"),
      endAt: z.number().optional().describe("End timestamp in milliseconds"),
    },
    async ({ userId, startAt, endAt }) => {
      const data = await client.call("GET", `/api/users/${userId}/usage`, undefined, {
        startAt,
        endAt,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

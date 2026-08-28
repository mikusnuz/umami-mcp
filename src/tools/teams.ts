import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

export function registerTeamTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "list_teams",
    "List all teams",
    {
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page (default 10)"),
      orderBy: z.string().optional().describe("Field to order by (e.g. 'name', 'createdAt')"),
      sortDescending: z.boolean().optional(),
    },
    async ({ page, pageSize, orderBy, sortDescending }) => {
      const data = await client.call("GET", "/api/teams", undefined, {
        page,
        pageSize,
        orderBy,
        sortDescending,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_team",
    "Create a new team",
    {
      name: z.string().max(50).describe("Team name"),
    },
    async ({ name }) => {
      const data = await client.call("POST", "/api/teams", { name });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_team",
    "Get details of a specific team",
    {
      teamId: z.string().uuid().describe("Team UUID"),
    },
    async ({ teamId }) => {
      const data = await client.call("GET", `/api/teams/${teamId}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_team",
    "Update a team's name or access code",
    {
      teamId: z.string().uuid().describe("Team UUID"),
      name: z.string().max(50).optional().describe("New team name"),
      accessCode: z.string().max(50).optional().describe("New access code"),
    },
    async ({ teamId, name, accessCode }) => {
      const data = await client.call("POST", `/api/teams/${teamId}`, { name, accessCode });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_team",
    "Delete a team",
    {
      teamId: z.string().uuid().describe("Team UUID to delete"),
    },
    async ({ teamId }) => {
      await client.call("DELETE", `/api/teams/${teamId}`);
      return { content: [{ type: "text", text: `Team ${teamId} deleted successfully.` }] };
    }
  );

  server.tool(
    "join_team",
    "Join a team using an access code",
    {
      accessCode: z.string().describe("Team access/invite code"),
    },
    async ({ accessCode }) => {
      const data = await client.call("POST", "/api/teams/join", { accessCode });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "list_team_users",
    "List all members of a team",
    {
      teamId: z.string().uuid().describe("Team UUID"),
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      search: z.string().optional().describe("Search query to filter members"),
    },
    async ({ teamId, page, pageSize, search }) => {
      const data = await client.call("GET", `/api/teams/${teamId}/users`, undefined, {
        page,
        pageSize,
        search,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "add_team_user",
    "Add a user to a team",
    {
      teamId: z.string().uuid().describe("Team UUID"),
      userId: z.string().uuid().describe("User UUID to add"),
      role: z.enum(["team-member", "team-view-only", "team-manager"]).describe("Role in the team"),
    },
    async ({ teamId, userId, role }) => {
      const data = await client.call("POST", `/api/teams/${teamId}/users`, { userId, role });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_team_user",
    "Update a team member's role",
    {
      teamId: z.string().uuid().describe("Team UUID"),
      userId: z.string().uuid().describe("User UUID"),
      role: z.enum(["team-member", "team-view-only", "team-manager"]).describe("New team role"),
    },
    async ({ teamId, userId, role }) => {
      const data = await client.call("POST", `/api/teams/${teamId}/users/${userId}`, { role });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_team_user",
    "Get details of a specific team member",
    {
      teamId: z.string().uuid().describe("Team UUID"),
      userId: z.string().uuid().describe("User UUID"),
    },
    async ({ teamId, userId }) => {
      const data = await client.call("GET", `/api/teams/${teamId}/users/${userId}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "remove_team_user",
    "Remove a user from a team",
    {
      teamId: z.string().uuid().describe("Team UUID"),
      userId: z.string().uuid().describe("User UUID to remove"),
    },
    async ({ teamId, userId }) => {
      await client.call("DELETE", `/api/teams/${teamId}/users/${userId}`);
      return { content: [{ type: "text", text: `User ${userId} removed from team ${teamId}.` }] };
    }
  );

  server.tool(
    "list_team_websites",
    "List all websites that belong to a team",
    {
      teamId: z.string().uuid().describe("Team UUID"),
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      search: z.string().optional().describe("Search query to filter websites"),
      orderBy: z.string().optional(),
      sortDescending: z.boolean().optional(),
    },
    async ({ teamId, page, pageSize, search, orderBy, sortDescending }) => {
      const data = await client.call("GET", `/api/teams/${teamId}/websites`, undefined, {
        page,
        pageSize,
        search,
        orderBy,
        sortDescending,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

}

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
      query: z.string().optional().describe("Search query to filter teams"),
      orderBy: z.string().optional().describe("Field to order by (e.g. 'name', 'createdAt')"),
    },
    async ({ page, pageSize, query, orderBy }) => {
      const data = await client.call("GET", "/api/teams", undefined, {
        page,
        pageSize,
        query,
        orderBy,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_team",
    "Create a new team",
    {
      name: z.string().describe("Team name"),
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
      teamId: z.string().describe("Team UUID"),
    },
    async ({ teamId }) => {
      const data = await client.call("GET", `/api/teams/${teamId}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_team",
    "Update a team's name",
    {
      teamId: z.string().describe("Team UUID"),
      name: z.string().describe("New team name"),
    },
    async ({ teamId, name }) => {
      const data = await client.call("POST", `/api/teams/${teamId}`, { name });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_team",
    "Delete a team",
    {
      teamId: z.string().describe("Team UUID to delete"),
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
      teamId: z.string().describe("Team UUID"),
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      query: z.string().optional().describe("Search query to filter members"),
    },
    async ({ teamId, page, pageSize, query }) => {
      const data = await client.call("GET", `/api/teams/${teamId}/users`, undefined, {
        page,
        pageSize,
        query,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "add_team_user",
    "Add a user to a team",
    {
      teamId: z.string().describe("Team UUID"),
      userId: z.string().describe("User UUID to add"),
      role: z.string().describe("Role in the team: 'team-owner' or 'team-member'"),
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
      teamId: z.string().describe("Team UUID"),
      userId: z.string().describe("User UUID"),
      role: z.string().describe("New role: 'team-owner' or 'team-member'"),
    },
    async ({ teamId, userId, role }) => {
      const data = await client.call("POST", `/api/teams/${teamId}/users/${userId}`, { role });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "remove_team_user",
    "Remove a user from a team",
    {
      teamId: z.string().describe("Team UUID"),
      userId: z.string().describe("User UUID to remove"),
    },
    async ({ teamId, userId }) => {
      await client.call("DELETE", `/api/teams/${teamId}/users/${userId}`);
      return { content: [{ type: "text", text: `User ${userId} removed from team ${teamId}.` }] };
    }
  );
}

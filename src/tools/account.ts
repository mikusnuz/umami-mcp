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
      orderBy: z.string().optional().describe("Sort field"),
      sortDescending: z.boolean().optional(),
      includeTeams: z.boolean().optional().describe("Include team-accessible websites"),
    },
    async ({ page, pageSize, orderBy, sortDescending, includeTeams }) => {
      const data = await client.call("GET", "/api/me/websites", undefined, {
        page,
        pageSize,
        orderBy,
        sortDescending,
        includeTeams,
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
      orderBy: z.string().optional().describe("Sort field"),
      sortDescending: z.boolean().optional(),
    },
    async ({ page, pageSize, orderBy, sortDescending }) => {
      const data = await client.call("GET", "/api/me/teams", undefined, {
        page,
        pageSize,
        orderBy,
        sortDescending,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_my_password",
    "Update the current user's password (self-hosted Umami only; Cloud API keys cannot call this route)",
    {
      currentPassword: z.string().describe("Current password"),
      newPassword: z.string().min(8).describe("New password (minimum 8 characters)"),
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
      const data = await client.call("POST", "/api/auth/verify");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_share",
    "Resolve a public Umami share by its slug without authentication",
    {
      slug: z.string().describe("Public share slug"),
    },
    async ({ slug }) => {
      const data = await client.call(
        "GET",
        `/api/share/${encodeURIComponent(slug)}`,
        undefined,
        undefined,
        { auth: "none", target: "collector" },
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "heartbeat",
    "Check if the Umami server is running and healthy",
    {},
    async () => {
      const data = await client.call(
        "GET",
        "/api/heartbeat",
        undefined,
        undefined,
        { auth: "none", target: "collector" },
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "complete_two_factor_login",
    "Complete a pending self-hosted Umami login after a tool reports that 2FA is required",
    {
      method: z.enum(["totp", "backupCode"]).describe("Verification method"),
      code: z.string().min(1).describe("Six-digit TOTP or backup code"),
    },
    async ({ method, code }) => {
      const data = await client.completeTwoFactorLogin(
        method === "totp" ? { token: code } : { backupCode: code },
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );
}

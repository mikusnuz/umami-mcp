import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function messageResult(message: string) {
  return { content: [{ type: "text" as const, text: message }] };
}

const paging = {
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
};

const listing = {
  ...paging,
  search: z.string().optional(),
  orderBy: z.string().optional(),
  sortDescending: z.boolean().optional(),
};

const primitive = z.union([z.string(), z.number(), z.boolean()]);
const filtersSchema = z
  .record(primitive)
  .optional()
  .describe("Additional current Umami filter fields such as path, event, country, or segment");

const unitSchema = z.enum(["minute", "hour", "day", "month", "year"]);

export function registerV3Tools(server: McpServer, client: UmamiClient) {
  registerBoardTools(server, client);
  registerLinkPixelTools(server, client);
  registerTwoFactorTools(server, client);
  registerSegmentTools(server, client);
  registerReplayTools(server, client);
  registerShareExportTools(server, client);
  registerRevenueTools(server, client);
  registerAdministrationTools(server, client);
}

function registerBoardTools(server: McpServer, client: UmamiClient) {
  const boardType = z.enum(["mixed", "website", "pixel", "link", "open"]);

  server.tool("list_boards", "List Umami v3 boards", listing, async (query) =>
    jsonResult(await client.call("GET", "/api/boards", undefined, query)),
  );

  server.tool(
    "create_board",
    "Create an Umami board",
    {
      type: boardType,
      name: z.string().max(100),
      description: z.string().max(500).optional(),
      teamId: z.string().uuid().optional(),
      parameters: z.record(z.unknown()).optional(),
    },
    async ({ type, name, description, teamId, parameters }) =>
      jsonResult(
        await client.call("POST", "/api/boards", {
          type,
          name,
          description,
          teamId,
          parameters,
        }),
      ),
  );

  server.tool(
    "get_board",
    "Get an Umami board",
    { boardId: z.string().uuid() },
    async ({ boardId }) => jsonResult(await client.call("GET", `/api/boards/${boardId}`)),
  );

  server.tool(
    "update_board",
    "Update an Umami board",
    {
      boardId: z.string().uuid(),
      type: z.enum(["dashboard", "mixed", "website", "pixel", "link", "open"]).optional(),
      name: z.string().max(200).optional(),
      description: z.string().max(500).optional(),
      parameters: z.record(z.unknown()).optional(),
    },
    async ({ boardId, ...body }) =>
      jsonResult(await client.call("POST", `/api/boards/${boardId}`, body)),
  );

  server.tool(
    "delete_board",
    "Delete an Umami board",
    { boardId: z.string().uuid() },
    async ({ boardId }) => {
      await client.call("DELETE", `/api/boards/${boardId}`);
      return messageResult(`Board ${boardId} deleted.`);
    },
  );

  server.tool(
    "clone_board",
    "Clone an Umami board",
    {
      boardId: z.string().uuid(),
      name: z.string().max(200).optional(),
      description: z.string().max(500).optional(),
      parameters: z.record(z.unknown()).optional(),
    },
    async ({ boardId, ...body }) =>
      jsonResult(await client.call("POST", `/api/boards/${boardId}/clone`, body)),
  );

  server.tool(
    "list_team_boards",
    "List boards belonging to a team",
    { teamId: z.string().uuid(), ...listing },
    async ({ teamId, ...query }) =>
      jsonResult(await client.call("GET", `/api/teams/${teamId}/boards`, undefined, query)),
  );
}

function registerLinkPixelTools(server: McpServer, client: UmamiClient) {
  server.tool("list_links", "List tracked links", listing, async (query) =>
    jsonResult(await client.call("GET", "/api/links", undefined, query)),
  );
  server.tool(
    "create_link",
    "Create a tracked link",
    {
      name: z.string().max(100),
      url: z.string().max(500),
      slug: z.string().min(8).max(100),
      teamId: z.string().uuid().optional(),
    },
    async (body) => jsonResult(await client.call("POST", "/api/links", body)),
  );
  server.tool("get_link", "Get a tracked link", { linkId: z.string().uuid() }, async ({ linkId }) =>
    jsonResult(await client.call("GET", `/api/links/${linkId}`)),
  );
  server.tool(
    "update_link",
    "Update a tracked link",
    {
      linkId: z.string().uuid(),
      name: z.string().max(100).optional(),
      url: z.string().max(500).optional(),
      slug: z.string().min(8).max(100).optional(),
    },
    async ({ linkId, ...body }) =>
      jsonResult(await client.call("POST", `/api/links/${linkId}`, body)),
  );
  server.tool("delete_link", "Delete a tracked link", { linkId: z.string().uuid() }, async ({ linkId }) => {
    await client.call("DELETE", `/api/links/${linkId}`);
    return messageResult(`Link ${linkId} deleted.`);
  });
  server.tool(
    "get_link_charts",
    "Get chart data for up to 20 tracked links",
    {
      linkIds: z.array(z.string().uuid()).min(1).max(20),
      startAt: z.number().int().optional(),
      endAt: z.number().int().optional(),
      timezone: z.string().optional(),
    },
    async ({ linkIds, startAt, endAt, timezone }) =>
      jsonResult(
        await client.call("GET", "/api/links/charts", undefined, {
          ids: linkIds.join(","),
          startAt,
          endAt,
          timezone,
        }),
      ),
  );

  server.tool("list_pixels", "List tracking pixels", listing, async (query) =>
    jsonResult(await client.call("GET", "/api/pixels", undefined, query)),
  );
  server.tool(
    "create_pixel",
    "Create a tracking pixel",
    {
      name: z.string().max(100),
      slug: z.string().min(8).max(100),
      teamId: z.string().uuid().optional(),
    },
    async (body) => jsonResult(await client.call("POST", "/api/pixels", body)),
  );
  server.tool("get_pixel", "Get a tracking pixel", { pixelId: z.string().uuid() }, async ({ pixelId }) =>
    jsonResult(await client.call("GET", `/api/pixels/${pixelId}`)),
  );
  server.tool(
    "update_pixel",
    "Update a tracking pixel",
    {
      pixelId: z.string().uuid(),
      name: z.string().max(100).optional(),
      slug: z.string().min(8).max(100).optional(),
    },
    async ({ pixelId, ...body }) =>
      jsonResult(await client.call("POST", `/api/pixels/${pixelId}`, body)),
  );
  server.tool("delete_pixel", "Delete a tracking pixel", { pixelId: z.string().uuid() }, async ({ pixelId }) => {
    await client.call("DELETE", `/api/pixels/${pixelId}`);
    return messageResult(`Pixel ${pixelId} deleted.`);
  });
  server.tool(
    "get_pixel_charts",
    "Get chart data for up to 20 tracking pixels",
    {
      pixelIds: z.array(z.string().uuid()).min(1).max(20),
      startAt: z.number().int().optional(),
      endAt: z.number().int().optional(),
      timezone: z.string().optional(),
    },
    async ({ pixelIds, startAt, endAt, timezone }) =>
      jsonResult(
        await client.call("GET", "/api/pixels/charts", undefined, {
          ids: pixelIds.join(","),
          startAt,
          endAt,
          timezone,
        }),
      ),
  );

  server.tool(
    "send_link_or_pixel_event",
    "Send a public collection event for a tracked link or pixel",
    {
      entityType: z.enum(["link", "pixel"]),
      entityId: z.string().uuid(),
      hostname: z.string().optional(),
      url: z.string().optional(),
      name: z.string().optional(),
      data: z.record(z.unknown()).optional(),
    },
    async ({ entityType, entityId, ...payload }) =>
      jsonResult(
        await client.call(
          "POST",
          "/api/send",
          { type: "event", payload: { [entityType]: entityId, ...payload } },
          undefined,
          { auth: "none", target: "collector" },
        ),
      ),
  );
  server.tool(
    "list_team_links",
    "List tracked links belonging to a team",
    { teamId: z.string().uuid(), ...listing },
    async ({ teamId, ...query }) =>
      jsonResult(await client.call("GET", `/api/teams/${teamId}/links`, undefined, query)),
  );
  server.tool(
    "list_team_pixels",
    "List tracking pixels belonging to a team",
    { teamId: z.string().uuid(), ...listing },
    async ({ teamId, ...query }) =>
      jsonResult(await client.call("GET", `/api/teams/${teamId}/pixels`, undefined, query)),
  );
}

function registerTwoFactorTools(server: McpServer, client: UmamiClient) {
  server.tool("get_two_factor_status", "Get self-hosted Umami 2FA status", {}, async () =>
    jsonResult(await client.call("GET", "/api/2fa/status")),
  );
  server.tool("initiate_two_factor_setup", "Start self-hosted Umami 2FA setup", {}, async () =>
    jsonResult(await client.call("POST", "/api/2fa/setup/initiate")),
  );
  server.tool(
    "confirm_two_factor_setup",
    "Confirm self-hosted Umami 2FA setup and receive one-time backup codes",
    { token: z.string().length(6) },
    async ({ token }) =>
      jsonResult(await client.call("POST", "/api/2fa/setup/confirm", { token })),
  );
  server.tool("cancel_two_factor_setup", "Cancel pending self-hosted Umami 2FA setup", {}, async () =>
    jsonResult(await client.call("POST", "/api/2fa/setup/cancel")),
  );
  server.tool(
    "disable_two_factor",
    "Disable self-hosted Umami 2FA when policy permits",
    { password: z.string(), token: z.string().length(6) },
    async (body) => jsonResult(await client.call("POST", "/api/2fa/disable", body)),
  );
  server.tool(
    "set_global_two_factor_requirement",
    "Require or stop requiring 2FA globally (self-hosted admin only)",
    { required: z.boolean() },
    async (body) => jsonResult(await client.call("POST", "/api/admin/2fa/global", body)),
  );
  server.tool(
    "set_user_two_factor_requirement",
    "Require or stop requiring 2FA for a user (self-hosted admin only)",
    { userId: z.string().uuid(), required: z.boolean() },
    async ({ userId, required }) =>
      jsonResult(await client.call("POST", `/api/admin/users/${userId}/2fa`, { required })),
  );
  server.tool(
    "get_user_two_factor_status",
    "Get a user's 2FA enrollment status (self-hosted admin only)",
    { userId: z.string().uuid() },
    async ({ userId }) =>
      jsonResult(await client.call("GET", `/api/admin/users/${userId}/2fa`)),
  );
  server.tool(
    "reset_user_two_factor",
    "Reset a user's 2FA enrollment and backup codes (self-hosted admin only)",
    { userId: z.string().uuid() },
    async ({ userId }) =>
      jsonResult(await client.call("DELETE", `/api/admin/users/${userId}/2fa`)),
  );
  server.tool(
    "set_team_two_factor_requirement",
    "Require or stop requiring 2FA for a team (self-hosted owner/manager only)",
    { teamId: z.string().uuid(), required: z.boolean() },
    async ({ teamId, required }) =>
      jsonResult(await client.call("POST", `/api/admin/teams/${teamId}/2fa`, { required })),
  );
}

function registerSegmentTools(server: McpServer, client: UmamiClient) {
  const segmentType = z.enum(["segment", "cohort"]);
  const segmentParameters = z.object({
    filters: z
      .array(
        z.object({
          name: z.string(),
          operator: z.enum([
            "eq",
            "neq",
            "s",
            "ns",
            "c",
            "dnc",
            "re",
            "nre",
            "t",
            "f",
            "gt",
            "lt",
            "gte",
            "lte",
            "bf",
            "af",
          ]),
          value: z.string(),
        }),
      )
      .optional(),
    match: z.enum(["all", "any"]).optional(),
    dateRange: z.string().optional(),
  });
  server.tool(
    "list_segments",
    "List saved segments or cohorts for a website",
    { websiteId: z.string().uuid(), type: segmentType, search: z.string().optional() },
    async ({ websiteId, ...query }) =>
      jsonResult(await client.call("GET", `/api/websites/${websiteId}/segments`, undefined, query)),
  );
  server.tool(
    "create_segment",
    "Create a saved segment or cohort",
    {
      websiteId: z.string().uuid(),
      type: segmentType,
      name: z.string().max(200),
      parameters: segmentParameters,
    },
    async ({ websiteId, ...body }) =>
      jsonResult(await client.call("POST", `/api/websites/${websiteId}/segments`, body)),
  );
  server.tool(
    "get_segment",
    "Get a saved segment or cohort",
    { websiteId: z.string().uuid(), segmentId: z.string().uuid() },
    async ({ websiteId, segmentId }) =>
      jsonResult(await client.call("GET", `/api/websites/${websiteId}/segments/${segmentId}`)),
  );
  server.tool(
    "update_segment",
    "Update a saved segment or cohort",
    {
      websiteId: z.string().uuid(),
      segmentId: z.string().uuid(),
      type: segmentType,
      name: z.string().max(200),
      parameters: z.record(z.unknown()),
    },
    async ({ websiteId, segmentId, ...body }) =>
      jsonResult(
        await client.call("POST", `/api/websites/${websiteId}/segments/${segmentId}`, body),
      ),
  );
  server.tool(
    "delete_segment",
    "Delete a saved segment or cohort",
    { websiteId: z.string().uuid(), segmentId: z.string().uuid() },
    async ({ websiteId, segmentId }) => {
      await client.call("DELETE", `/api/websites/${websiteId}/segments/${segmentId}`);
      return messageResult(`Segment ${segmentId} deleted.`);
    },
  );
}

function registerReplayTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "get_recorder_config",
    "Get public session-replay and heatmap recorder configuration",
    { websiteId: z.string().uuid() },
    async ({ websiteId }) =>
      jsonResult(
        await client.call(
          "GET",
          `/api/websites/${websiteId}/recorder`,
          undefined,
          undefined,
          { auth: "none", target: "collector" },
        ),
      ),
  );
  server.tool(
    "list_replays",
    "List session replays for a website",
    {
      websiteId: z.string().uuid(),
      startAt: z.number().int(),
      endAt: z.number().int(),
      minDuration: z.number().int().nonnegative().optional(),
      search: z.string().optional(),
      ...paging,
      filters: filtersSchema,
    },
    async ({ websiteId, filters, ...query }) =>
      jsonResult(
        await client.call("GET", `/api/websites/${websiteId}/replays`, undefined, {
          ...filters,
          ...query,
        }),
      ),
  );
  server.tool(
    "get_replay",
    "Get reconstructed events for one session replay",
    {
      websiteId: z.string().uuid(),
      replayId: z.string(),
      until: z.number().int().optional(),
      chunkIndex: z.number().int().nonnegative().optional(),
      eventIndex: z.number().int().nonnegative().optional(),
    },
    async ({ websiteId, replayId, ...query }) =>
      jsonResult(
        await client.call(
          "GET",
          `/api/websites/${websiteId}/replays/${encodeURIComponent(replayId)}`,
          undefined,
          query,
        ),
      ),
  );
  server.tool(
    "list_saved_replays",
    "List saved session replays",
    { websiteId: z.string().uuid(), search: z.string().optional(), ...paging },
    async ({ websiteId, ...query }) =>
      jsonResult(
        await client.call("GET", `/api/websites/${websiteId}/replays/saved`, undefined, query),
      ),
  );
  server.tool(
    "set_replay_saved",
    "Save or unsave a session replay (name is used when saving)",
    {
      websiteId: z.string().uuid(),
      replayId: z.string(),
      isSaved: z.boolean(),
      name: z.string().max(100).optional(),
    },
    async ({ websiteId, replayId, ...body }) =>
      jsonResult(
        await client.call(
          "POST",
          `/api/websites/${websiteId}/replays/saved/${encodeURIComponent(replayId)}`,
          body,
        ),
      ),
  );
  server.tool(
    "get_replay_saved_status",
    "Check whether one session replay is saved",
    { websiteId: z.string().uuid(), replayId: z.string() },
    async ({ websiteId, replayId }) =>
      jsonResult(
        await client.call(
          "GET",
          `/api/websites/${websiteId}/replays/saved/${encodeURIComponent(replayId)}`,
        ),
      ),
  );
  server.tool(
    "list_session_replays",
    "List replay recordings linked to one session",
    {
      websiteId: z.string().uuid(),
      sessionId: z.string(),
      startAt: z.number().int(),
      endAt: z.number().int(),
      search: z.string().optional(),
      ...paging,
    },
    async ({ websiteId, sessionId, ...query }) =>
      jsonResult(
        await client.call(
          "GET",
          `/api/websites/${websiteId}/sessions/${sessionId}/replays`,
          undefined,
          query,
        ),
      ),
  );
}

function registerShareExportTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "list_entity_shares",
    "List shares for a website, link, pixel, or board",
    {
      entityType: z.enum(["website", "link", "pixel", "board"]),
      entityId: z.string().uuid(),
      search: z.string().optional(),
      ...paging,
    },
    async ({ entityType, entityId, ...query }) => {
      const plural = {
        website: "websites",
        link: "links",
        pixel: "pixels",
        board: "boards",
      }[entityType];
      return jsonResult(
        await client.call("GET", `/api/${plural}/${entityId}/shares`, undefined, query),
      );
    },
  );
  server.tool(
    "create_share",
    "Create a share for a website, link, pixel, or board",
    {
      entityId: z.string().uuid(),
      shareType: z.enum(["website", "link", "pixel", "board"]),
      name: z.string().max(200),
      slug: z.string().max(100).optional(),
      parameters: z.record(z.unknown()).default({}),
    },
    async ({ entityId, shareType, name, slug, parameters }) => {
      const shareTypeCode = { website: 1, link: 2, pixel: 3, board: 4 }[shareType];
      return jsonResult(
        await client.call("POST", "/api/share", {
          entityId,
          shareType: shareTypeCode,
          name,
          slug,
          parameters,
        }),
      );
    },
  );
  server.tool(
    "list_website_shares",
    "List shares created for a website",
    { websiteId: z.string().uuid(), search: z.string().optional(), ...paging },
    async ({ websiteId, ...query }) =>
      jsonResult(
        await client.call("GET", `/api/websites/${websiteId}/shares`, undefined, query),
      ),
  );
  server.tool(
    "create_website_share",
    "Create a website share",
    {
      websiteId: z.string().uuid(),
      name: z.string().max(200),
      parameters: z.record(z.unknown()).optional(),
    },
    async ({ websiteId, ...body }) =>
      jsonResult(await client.call("POST", `/api/websites/${websiteId}/shares`, body)),
  );
  server.tool(
    "get_share_by_id",
    "Get a managed share by internal ID",
    { shareId: z.string().uuid() },
    async ({ shareId }) => jsonResult(await client.call("GET", `/api/share/id/${shareId}`)),
  );
  server.tool(
    "update_share",
    "Update a managed share",
    {
      shareId: z.string().uuid(),
      name: z.string().max(200),
      slug: z.string().max(100),
      parameters: z.record(z.unknown()),
    },
    async ({ shareId, ...body }) =>
      jsonResult(await client.call("POST", `/api/share/id/${shareId}`, body)),
  );
  server.tool("delete_share", "Delete a managed share", { shareId: z.string().uuid() }, async ({ shareId }) => {
    await client.call("DELETE", `/api/share/id/${shareId}`);
    return messageResult(`Share ${shareId} deleted.`);
  });
  server.tool(
    "export_website",
    "Export website analytics as a base64-encoded ZIP of CSV files",
    {
      websiteId: z.string().uuid(),
      startAt: z.number().int(),
      endAt: z.number().int(),
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().optional(),
    },
    async ({ websiteId, ...query }) =>
      jsonResult(
        await client.call("GET", `/api/websites/${websiteId}/export`, undefined, query),
      ),
  );
}

function registerRevenueTools(server: McpServer, client: UmamiClient) {
  const revenueBase = {
    websiteId: z.string().uuid(),
    startAt: z.number().int(),
    endAt: z.number().int(),
    currency: z.string().min(1),
    unit: unitSchema.optional(),
    timezone: z.string().optional(),
    compare: z.enum(["prev", "yoy"]).optional(),
    filters: filtersSchema,
  };

  server.tool("get_revenue_stats", "Get revenue summary and comparison", revenueBase, async ({ websiteId, filters, ...query }) =>
    jsonResult(
      await client.call("GET", `/api/websites/${websiteId}/revenue/stats`, undefined, {
        ...filters,
        ...query,
      }),
    ),
  );
  server.tool("get_revenue_chart", "Get revenue chart data", revenueBase, async ({ websiteId, filters, ...query }) =>
    jsonResult(
      await client.call("GET", `/api/websites/${websiteId}/revenue/chart`, undefined, {
        ...filters,
        ...query,
      }),
    ),
  );
  server.tool(
    "get_revenue_metrics",
    "Get revenue metrics by dimension",
    { ...revenueBase, type: z.enum(["country", "region", "referrer", "channel"]) },
    async ({ websiteId, filters, ...query }) =>
      jsonResult(
        await client.call("GET", `/api/websites/${websiteId}/revenue/metrics`, undefined, {
          ...filters,
          ...query,
        }),
      ),
  );
  server.tool(
    "get_revenue_sessions",
    "List sessions with revenue data",
    { ...revenueBase, search: z.string().optional(), ...paging },
    async ({ websiteId, filters, ...query }) =>
      jsonResult(
        await client.call("GET", `/api/websites/${websiteId}/revenue/sessions`, undefined, {
          ...filters,
          ...query,
        }),
      ),
  );
}

function registerAdministrationTools(server: McpServer, client: UmamiClient) {
  server.tool("list_admin_teams", "List every team (self-hosted admin only)", listing, async (query) =>
    jsonResult(await client.call("GET", "/api/admin/teams", undefined, query)),
  );
  server.tool("list_admin_websites", "List every website (self-hosted admin only)", listing, async (query) =>
    jsonResult(await client.call("GET", "/api/admin/websites", undefined, query)),
  );
  server.tool(
    "delete_session",
    "Delete one session (self-hosted relational storage only)",
    { websiteId: z.string().uuid(), sessionId: z.string() },
    async ({ websiteId, sessionId }) => {
      await client.call("DELETE", `/api/websites/${websiteId}/sessions/${sessionId}`);
      return messageResult(`Session ${sessionId} deleted.`);
    },
  );
}

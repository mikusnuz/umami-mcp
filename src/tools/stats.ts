import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

const dateRange = {
  startAt: z.number().describe("Start timestamp in milliseconds"),
  endAt: z.number().describe("End timestamp in milliseconds"),
};

const unit = z
  .enum(["minute", "hour", "day", "month", "year"])
  .describe("Time grouping unit supported by Umami v3");

const filters = z
  .record(z.union([z.string(), z.number(), z.boolean()]))
  .optional()
  .describe("Additional Umami v3 filters such as country, device, browser, tag, UTM fields, segment, or cohort");

export function registerStatsTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "get_stats",
    "Get summary statistics for a website (pageviews, visitors, visits, bounces, totaltime)",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      path: z.string().optional().describe("Filter by URL path"),
      referrer: z.string().optional().describe("Filter by referrer"),
      event: z.string().optional().describe("Filter by event name"),
      hostname: z.string().optional().describe("Filter by hostname"),
      segment: z.string().uuid().optional().describe("Saved segment UUID"),
      filters,
    },
    async ({ websiteId, startAt, endAt, path, referrer, event, hostname, segment, filters }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/stats`, undefined, {
        ...filters,
        startAt,
        endAt,
        path,
        referrer,
        event,
        hostname,
        segment,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_pageviews",
    "Get pageview and session counts over time for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      unit: unit.optional(),
      timezone: z.string().optional().describe("Timezone (e.g. 'Asia/Seoul')"),
      path: z.string().optional().describe("Filter by URL path"),
      referrer: z.string().optional().describe("Filter by referrer"),
      filters,
    },
    async ({ websiteId, startAt, endAt, unit, timezone, path, referrer, filters }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/pageviews`, undefined, {
        ...filters,
        startAt,
        endAt,
        unit,
        timezone,
        path,
        referrer,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_metrics",
    "Get aggregated metrics for a website (e.g. top pages, browsers, countries, devices, OS, events)",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      type: z
        .enum([
          "path",
          "fullPath",
          "entry",
          "exit",
          "referrer",
          "domain",
          "browser",
          "os",
          "device",
          "screen",
          "country",
          "region",
          "city",
          "language",
          "distinctId",
          "event",
          "query",
          "title",
          "hostname",
          "tag",
          "utmSource",
          "utmMedium",
          "utmCampaign",
          "utmContent",
          "utmTerm",
          "channel",
        ])
        .describe("Metric type to aggregate"),
      path: z.string().optional().describe("Filter by URL path"),
      referrer: z.string().optional().describe("Filter by referrer"),
      limit: z.number().optional().describe("Max results to return (default 500)"),
      offset: z.number().int().nonnegative().optional(),
      search: z.string().optional().describe("Search metric values"),
      filters,
    },
    async ({ websiteId, startAt, endAt, type, path, referrer, limit, offset, search, filters }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/metrics`, undefined, {
        ...filters,
        startAt,
        endAt,
        type,
        path,
        referrer,
        limit,
        offset,
        search,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_events",
    "List event rows for a website with current Umami v3 filters and pagination",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      path: z.string().optional().describe("Filter by URL path"),
      event: z.string().optional().describe("Filter by event name"),
      search: z.string().optional().describe("Free-text search"),
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().optional(),
      maxResults: z.number().int().positive().optional(),
      filters,
    },
    async ({ websiteId, startAt, endAt, path, event, search, page, pageSize, maxResults, filters }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/events`, undefined, {
        ...filters,
        startAt,
        endAt,
        path,
        event,
        search,
        page,
        pageSize,
        maxResults,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_sessions",
    "Get session data for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      search: z.string().optional().describe("Free-text session search"),
      query: z.string().optional().describe("Filter by URL query string"),
      path: z.string().optional().describe("Filter by URL path"),
      distinctId: z.string().optional().describe("Filter by distinct ID"),
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      maxResults: z.number().int().positive().optional(),
      filters,
    },
    async ({ websiteId, startAt, endAt, search, query, path, distinctId, page, pageSize, maxResults, filters }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/sessions`, undefined, {
        ...filters,
        startAt,
        endAt,
        search,
        query,
        path,
        distinctId,
        page,
        pageSize,
        maxResults,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_daterange",
    "Get the date range of available data for a website",
    {
      websiteId: z.string().describe("Website UUID"),
    },
    async ({ websiteId }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/daterange`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_event_series",
    "Get event metrics over time (event series data) for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      unit: unit.optional(),
      timezone: z.string().describe("IANA timezone (e.g. 'Asia/Seoul')"),
      path: z.string().optional().describe("Filter by URL path"),
      event: z.string().optional().describe("Filter by event name"),
      limit: z.number().int().positive().optional(),
      filters,
    },
    async ({ websiteId, startAt, endAt, unit, timezone, path, event, limit, filters }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/events/series`, undefined, {
        ...filters,
        startAt,
        endAt,
        unit,
        timezone,
        path,
        event,
        limit,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_session_stats",
    "Get summarized session statistics for a website (total sessions, unique visitors, etc.)",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      path: z.string().optional().describe("Filter by URL path"),
      referrer: z.string().optional().describe("Filter by referrer"),
      filters,
    },
    async ({ websiteId, startAt, endAt, path, referrer, filters }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/sessions/stats`, undefined, {
        ...filters,
        startAt,
        endAt,
        path,
        referrer,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_sessions_weekly",
    "Get weekly session data for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      timezone: z.string().describe("IANA timezone (e.g. 'Asia/Seoul')"),
      filters,
    },
    async ({ websiteId, startAt, endAt, timezone, filters }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/sessions/weekly`, undefined, {
        ...filters,
        startAt,
        endAt,
        timezone,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

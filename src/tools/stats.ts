import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

const dateRange = {
  startAt: z.number().describe("Start timestamp in milliseconds"),
  endAt: z.number().describe("End timestamp in milliseconds"),
};

export function registerStatsTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "get_stats",
    "Get summary statistics for a website (pageviews, visitors, visits, bounces, totaltime)",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      url: z.string().optional().describe("Filter by URL path"),
      referrer: z.string().optional().describe("Filter by referrer"),
    },
    async ({ websiteId, startAt, endAt, url, referrer }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/stats`, undefined, {
        startAt,
        endAt,
        url,
        referrer,
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
      unit: z.enum(["hour", "day", "week", "month", "year"]).describe("Time grouping unit"),
      timezone: z.string().optional().describe("Timezone (e.g. 'Asia/Seoul')"),
      url: z.string().optional().describe("Filter by URL path"),
      referrer: z.string().optional().describe("Filter by referrer"),
    },
    async ({ websiteId, startAt, endAt, unit, timezone, url, referrer }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/pageviews`, undefined, {
        startAt,
        endAt,
        unit,
        timezone,
        url,
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
          "url",
          "referrer",
          "browser",
          "os",
          "device",
          "country",
          "region",
          "city",
          "language",
          "event",
          "query",
          "title",
          "host",
          "tag",
        ])
        .describe("Metric type to aggregate"),
      url: z.string().optional().describe("Filter by URL path"),
      referrer: z.string().optional().describe("Filter by referrer"),
      limit: z.number().optional().describe("Max results to return (default 500)"),
    },
    async ({ websiteId, startAt, endAt, type, url, referrer, limit }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/metrics`, undefined, {
        startAt,
        endAt,
        type,
        url,
        referrer,
        limit,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_events",
    "Get event data for a website over time",
    {
      websiteId: z.string().describe("Website UUID"),
      ...dateRange,
      unit: z.enum(["hour", "day", "week", "month", "year"]).describe("Time grouping unit"),
      timezone: z.string().optional().describe("Timezone (e.g. 'Asia/Seoul')"),
      url: z.string().optional().describe("Filter by URL path"),
    },
    async ({ websiteId, startAt, endAt, unit, timezone, url }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/events`, undefined, {
        startAt,
        endAt,
        unit,
        timezone,
        url,
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
      query: z.string().optional().describe("Search query"),
      page: z.number().optional().describe("Page number (1-based)"),
      pageSize: z.number().optional().describe("Results per page"),
      orderBy: z.string().optional().describe("Field to order by"),
    },
    async ({ websiteId, startAt, endAt, query, page, pageSize, orderBy }) => {
      const data = await client.call("GET", `/api/websites/${websiteId}/sessions`, undefined, {
        startAt,
        endAt,
        query,
        page,
        pageSize,
        orderBy,
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
}

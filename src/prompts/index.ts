import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "site_overview",
    "Comprehensive overview of a website's analytics — fetches stats, pageviews, top pages, and active visitors",
    { websiteId: z.string().describe("Website UUID to analyze") },
    ({ websiteId }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `Provide a comprehensive analytics overview for website ID: ${websiteId}`,
              "",
              "Please use the following tools in order:",
              `1. get_stats — get summary statistics for the last 7 days (startAt: ${Date.now() - 7 * 86400000}, endAt: ${Date.now()})`,
              `2. get_pageviews — get daily pageview trends for the last 7 days with unit "day"`,
              `3. get_metrics — get top 10 pages (type: "url", limit: 10) for the last 7 days`,
              `4. get_metrics — get top 5 referrers (type: "referrer", limit: 5) for the last 7 days`,
              `5. get_active_visitors — get current active visitor count`,
              "",
              "Then summarize all findings in a clear, structured report with:",
              "- Key metrics (pageviews, visitors, bounce rate, avg visit time)",
              "- Traffic trend (up/down compared to previous period)",
              "- Top performing pages",
              "- Top traffic sources",
              "- Current real-time activity",
            ].join("\n"),
          },
        },
      ],
    })
  );

  server.prompt(
    "traffic_compare",
    "Compare traffic between two date ranges to identify trends",
    {
      websiteId: z.string().describe("Website UUID to analyze"),
      period1Start: z.string().describe("Period 1 start date (ISO 8601, e.g. '2025-01-01')"),
      period1End: z.string().describe("Period 1 end date (ISO 8601)"),
      period2Start: z.string().describe("Period 2 start date (ISO 8601)"),
      period2End: z.string().describe("Period 2 end date (ISO 8601)"),
    },
    ({ websiteId, period1Start, period1End, period2Start, period2End }) => {
      const p1s = new Date(period1Start).getTime();
      const p1e = new Date(period1End).getTime();
      const p2s = new Date(period2Start).getTime();
      const p2e = new Date(period2End).getTime();

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: [
                `Compare traffic for website ${websiteId} between two periods:`,
                `- Period 1: ${period1Start} to ${period1End}`,
                `- Period 2: ${period2Start} to ${period2End}`,
                "",
                "Use these tools for each period:",
                `1. get_stats — Period 1 (startAt: ${p1s}, endAt: ${p1e})`,
                `2. get_stats — Period 2 (startAt: ${p2s}, endAt: ${p2e})`,
                `3. get_metrics — Period 1 top pages (type: "url", limit: 10, startAt: ${p1s}, endAt: ${p1e})`,
                `4. get_metrics — Period 2 top pages (type: "url", limit: 10, startAt: ${p2s}, endAt: ${p2e})`,
                "",
                "Then provide a comparison report:",
                "- Percentage changes in key metrics (pageviews, visitors, bounce rate)",
                "- Pages that gained or lost traffic",
                "- Overall trend assessment and recommendations",
              ].join("\n"),
            },
          },
        ],
      };
    }
  );
}

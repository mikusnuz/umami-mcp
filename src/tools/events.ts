import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

export function registerEventTools(server: McpServer, client: UmamiClient) {
  server.tool(
    "send_event",
    "Send a custom event or pageview to Umami (useful for server-side tracking)",
    {
      websiteId: z.string().describe("Website UUID (used as the 'website' field in payload)"),
      hostname: z.string().describe("Hostname of the site (e.g. 'example.com')"),
      url: z.string().describe("URL path (e.g. '/checkout')"),
      eventName: z.string().optional().describe("Custom event name (omit for pageview)"),
      eventData: z
        .record(z.unknown())
        .optional()
        .describe("Custom event data as key-value pairs"),
      referrer: z.string().optional().describe("Referrer URL"),
      language: z.string().optional().describe("Browser language (e.g. 'en-US')"),
      title: z.string().optional().describe("Page title"),
    },
    async ({ websiteId, hostname, url, eventName, eventData, referrer, language, title }) => {
      const payload: Record<string, unknown> = {
        website: websiteId,
        hostname,
        url,
      };
      if (eventName) payload.name = eventName;
      if (eventData) payload.data = eventData;
      if (referrer) payload.referrer = referrer;
      if (language) payload.language = language;
      if (title) payload.title = title;

      await client.call("POST", "/api/send", {
        type: eventName ? "event" : "pageview",
        payload,
      });
      return { content: [{ type: "text", text: "Event sent successfully." }] };
    }
  );

  server.tool(
    "get_event_values",
    "Get event or session property values for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
    },
    async ({ websiteId, startAt, endAt }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/values`,
        undefined,
        { startAt, endAt }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

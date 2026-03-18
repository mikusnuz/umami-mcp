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

  server.tool(
    "get_event_data_events",
    "Get event data events (custom event names and counts) for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
      eventName: z.string().optional().describe("Filter by event name"),
    },
    async ({ websiteId, startAt, endAt, eventName }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/events`,
        undefined,
        { startAt, endAt, eventName }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_event_data_fields",
    "Get event data fields (property keys and their data types) for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
      eventName: z.string().optional().describe("Filter by event name"),
    },
    async ({ websiteId, startAt, endAt, eventName }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/fields`,
        undefined,
        { startAt, endAt, eventName }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_event_data_values",
    "Get event data values (aggregated counts for a specific property) for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
      eventName: z.string().optional().describe("Filter by event name"),
      propertyName: z.string().optional().describe("Filter by property name"),
    },
    async ({ websiteId, startAt, endAt, eventName, propertyName }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/values`,
        undefined,
        { startAt, endAt, eventName, propertyName }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_event_data_stats",
    "Get event data statistics (summary counts) for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
      eventName: z.string().optional().describe("Filter by event name"),
    },
    async ({ websiteId, startAt, endAt, eventName }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/stats`,
        undefined,
        { startAt, endAt, eventName }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "batch_events",
    "Send multiple events or pageviews in a single batch request",
    {
      events: z
        .array(
          z.object({
            websiteId: z.string().describe("Website UUID"),
            hostname: z.string().describe("Hostname"),
            url: z.string().describe("URL path"),
            eventName: z.string().optional().describe("Event name (omit for pageview)"),
            eventData: z.record(z.unknown()).optional().describe("Custom event data"),
            referrer: z.string().optional().describe("Referrer URL"),
            language: z.string().optional().describe("Browser language"),
            title: z.string().optional().describe("Page title"),
          })
        )
        .describe("Array of events to send"),
    },
    async ({ events }) => {
      const payload = events.map((e) => {
        const p: Record<string, unknown> = {
          website: e.websiteId,
          hostname: e.hostname,
          url: e.url,
        };
        if (e.eventName) p.name = e.eventName;
        if (e.eventData) p.data = e.eventData;
        if (e.referrer) p.referrer = e.referrer;
        if (e.language) p.language = e.language;
        if (e.title) p.title = e.title;
        return {
          type: e.eventName ? "event" : "pageview",
          payload: p,
        };
      });
      await client.call("POST", "/api/batch", { events: payload });
      return { content: [{ type: "text", text: `Batch of ${events.length} events sent successfully.` }] };
    }
  );
}

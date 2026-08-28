import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

const filtersSchema = z
  .record(z.union([z.string(), z.number(), z.boolean()]))
  .optional()
  .describe("Additional current Umami filter fields");

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
      screen: z.string().optional().describe("Screen dimensions (e.g. 1920x1080)"),
      tag: z.string().optional().describe("Event tag"),
      distinctId: z.string().optional().describe("Stable user identifier"),
      timestamp: z.number().int().optional().describe("Unix timestamp in seconds"),
      ip: z.string().optional().describe("Client IP for trusted server-side collection"),
      userAgent: z.string().optional().describe("Client user agent"),
    },
    async ({ websiteId, hostname, url, eventName, eventData, referrer, language, title, screen, tag, distinctId, timestamp, ip, userAgent }) => {
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
      if (screen) payload.screen = screen;
      if (tag) payload.tag = tag;
      if (distinctId) payload.id = distinctId;
      if (timestamp !== undefined) payload.timestamp = timestamp;
      if (ip) payload.ip = ip;
      if (userAgent) payload.userAgent = userAgent;

      const result = await client.call(
        "POST",
        "/api/send",
        { type: "event", payload },
        undefined,
        { auth: "none", target: "collector" },
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_event_values",
    "Get event or session property values for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
      type: z
        .enum([
          "path",
          "referrer",
          "title",
          "query",
          "os",
          "browser",
          "device",
          "country",
          "region",
          "city",
          "tag",
          "hostname",
          "distinctId",
          "language",
          "event",
          "utmSource",
          "utmMedium",
          "utmCampaign",
          "utmContent",
          "utmTerm",
        ])
        .describe("Property dimension whose values should be returned"),
      search: z.string().optional().describe("Search returned values"),
      filters: filtersSchema,
    },
    async ({ websiteId, startAt, endAt, type, search, filters }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/values`,
        undefined,
        { ...filters, startAt, endAt, type, search }
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
      event: z.string().optional().describe("Filter by event name"),
      filters: filtersSchema,
    },
    async ({ websiteId, startAt, endAt, event, filters }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/events`,
        undefined,
        { ...filters, startAt, endAt, event }
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
      filters: filtersSchema,
    },
    async ({ websiteId, startAt, endAt, eventName, filters }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/fields`,
        undefined,
        { ...filters, startAt, endAt, eventName }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_event_data_properties",
    "Get custom-event property names and their data types for a website",
    {
      websiteId: z.string().uuid().describe("Website UUID"),
      startAt: z.number().int().describe("Start timestamp in milliseconds"),
      endAt: z.number().int().describe("End timestamp in milliseconds"),
      filters: filtersSchema,
    },
    async ({ websiteId, startAt, endAt, filters }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/properties`,
        undefined,
        { ...filters, startAt, endAt },
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_event_data_by_id",
    "Get the custom data attached to one event",
    {
      websiteId: z.string().uuid().describe("Website UUID"),
      eventId: z.string().describe("Event ID"),
    },
    async ({ websiteId, eventId }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/${encodeURIComponent(eventId)}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_event_data_values",
    "Get event data values (aggregated counts for a specific property) for a website",
    {
      websiteId: z.string().describe("Website UUID"),
      startAt: z.number().describe("Start timestamp in milliseconds"),
      endAt: z.number().describe("End timestamp in milliseconds"),
      eventName: z.string().optional().describe("Filter by event name"),
      propertyName: z.string().describe("Property name to aggregate"),
      dataType: z.number().int().optional().describe("Optional Umami data type code"),
      filters: filtersSchema,
    },
    async ({ websiteId, startAt, endAt, eventName, propertyName, dataType, filters }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/values`,
        undefined,
        { ...filters, startAt, endAt, eventName, propertyName, dataType }
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
      event: z.string().optional().describe("Filter by event name"),
      filters: filtersSchema,
    },
    async ({ websiteId, startAt, endAt, event, filters }) => {
      const data = await client.call(
        "GET",
        `/api/websites/${websiteId}/event-data/stats`,
        undefined,
        { ...filters, startAt, endAt, event }
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
            tag: z.string().optional(),
            screen: z.string().optional(),
            distinctId: z.string().optional(),
            timestamp: z.number().int().optional().describe("Unix timestamp in seconds"),
            ip: z.string().optional().describe("Client IP for trusted server-side collection"),
            userAgent: z.string().optional().describe("Client user agent"),
          })
        )
        .min(1)
        .max(500)
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
        if (e.tag) p.tag = e.tag;
        if (e.screen) p.screen = e.screen;
        if (e.distinctId) p.id = e.distinctId;
        if (e.timestamp !== undefined) p.timestamp = e.timestamp;
        if (e.ip) p.ip = e.ip;
        if (e.userAgent) p.userAgent = e.userAgent;
        return {
          type: "event",
          payload: p,
        };
      });
      const result = await client.call("POST", "/api/batch", payload, undefined, {
        auth: "none",
        target: "collector",
      });
      const failed =
        typeof result === "object" &&
        result !== null &&
        typeof (result as { errors?: unknown }).errors === "number"
          ? (result as { errors: number }).errors
          : 0;
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: failed > 0,
      };
    }
  );

  server.tool(
    "send_identify",
    "Attach custom session data or a distinct ID through Umami's public collection API",
    {
      websiteId: z.string().uuid().describe("Website UUID"),
      distinctId: z.string().optional().describe("Your stable user identifier"),
      data: z.record(z.unknown()).describe("Session properties"),
      hostname: z.string().optional(),
      url: z.string().optional(),
    },
    async ({ websiteId, distinctId, data, hostname, url }) => {
      const payload: Record<string, unknown> = { website: websiteId, data };
      if (distinctId) payload.id = distinctId;
      if (hostname) payload.hostname = hostname;
      if (url) payload.url = url;
      const result = await client.call(
        "POST",
        "/api/send",
        { type: "identify", payload },
        undefined,
        { auth: "none", target: "collector" },
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "send_performance",
    "Send Core Web Vitals through Umami's public collection API",
    {
      websiteId: z.string().uuid().describe("Website UUID"),
      hostname: z.string().describe("Website hostname"),
      url: z.string().describe("Page URL or path"),
      lcp: z.number().nonnegative().max(60000).optional(),
      inp: z.number().nonnegative().max(60000).optional(),
      cls: z.number().nonnegative().max(100).optional(),
      fcp: z.number().nonnegative().max(60000).optional(),
      ttfb: z.number().nonnegative().max(60000).optional(),
    },
    async ({ websiteId, hostname, url, lcp, inp, cls, fcp, ttfb }) => {
      const result = await client.call(
        "POST",
        "/api/send",
        {
          type: "performance",
          payload: { website: websiteId, hostname, url, lcp, inp, cls, fcp, ttfb },
        },
        undefined,
        { auth: "none", target: "collector" },
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}

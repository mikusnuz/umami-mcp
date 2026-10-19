import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UmamiClient } from "../client.js";

const website = { websiteId: z.string().uuid() };
const annotation = { ...website, annotationId: z.string().uuid() };
const fields = {
  date: z.union([z.string().date(), z.string().datetime({ offset: true })])
    .describe("ISO date (YYYY-MM-DD) or timestamp with timezone"),
  allDay: z.boolean().default(true),
  note: z.string().min(1).max(500),
};

const jsonResult = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export function registerAnnotationTools(server: McpServer, client: UmamiClient) {
  server.tool("list_annotations", "List website annotations (Umami 3.4+)", {
    ...website,
    startAt: z.number().int().optional().describe("Start timestamp in milliseconds; requires endAt"),
    endAt: z.number().int().optional().describe("End timestamp in milliseconds; requires startAt"),
    search: z.string().optional(),
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
  }, async ({ websiteId, ...query }) => {
    if ((query.startAt === undefined) !== (query.endAt === undefined)) {
      throw new Error("Provide both startAt and endAt, or omit both.");
    }
    if (query.startAt !== undefined && query.endAt !== undefined && query.startAt > query.endAt) {
      throw new Error("startAt must not exceed endAt.");
    }
    return jsonResult(await client.call("GET", `/api/websites/${websiteId}/annotations`, undefined, query));
  });

  server.tool("get_annotation", "Get a website annotation (Umami 3.4+)", annotation,
    async ({ websiteId, annotationId }) =>
      jsonResult(await client.call("GET", `/api/websites/${websiteId}/annotations/${annotationId}`)),
  );

  server.tool("create_annotation", "Add a dated note to a website's charts (Umami 3.4+)", {
    ...website, ...fields,
  }, async ({ websiteId, ...body }) =>
    jsonResult(await client.call("POST", `/api/websites/${websiteId}/annotations`, body)),
  );

  server.tool("update_annotation", "Replace an annotation's date, note and all-day flag (Umami 3.4+)", {
    ...annotation, ...fields,
  }, async ({ websiteId, annotationId, ...body }) =>
    jsonResult(await client.call("POST", `/api/websites/${websiteId}/annotations/${annotationId}`, body)),
  );

  server.tool("delete_annotation", "Delete a website annotation (Umami 3.4+)", annotation,
    async ({ websiteId, annotationId }) =>
      jsonResult(await client.call("DELETE", `/api/websites/${websiteId}/annotations/${annotationId}`)),
  );
}

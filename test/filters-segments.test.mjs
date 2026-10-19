import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerStatsTools } from "../dist/tools/stats.js";
import { registerEventTools } from "../dist/tools/events.js";
import { registerSessionTools } from "../dist/tools/sessions.js";
import { registerV3Tools } from "../dist/tools/v3.js";
import { mergeFilters } from "../dist/query.js";

const websiteId = "00000000-0000-4000-8000-000000000001";
const segmentId = "00000000-0000-4000-8000-000000000002";

async function setup(t) {
  const calls = [];
  const server = new McpServer({ name: "contract-test", version: "1.0.0" });
  const api = { async call(...args) { calls.push(args); return { ok: true }; } };
  for (const register of [registerStatsTools, registerEventTools, registerSessionTools, registerV3Tools]) register(server, api);
  const client = new Client({ name: "contract-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  t.after(async () => { await client.close(); await server.close(); });
  return { calls, call: (name, args) => client.callTool({ name, arguments: args }) };
}

test("all analytics tool families retain nested filters and explicit values take precedence", async (t) => {
  const { calls, call } = await setup(t);
  const range = { websiteId, startAt: 1000, endAt: 2000 };
  for (const [name, extra, nested] of [
    ["get_stats", {}, { path: "/paid", segment: segmentId, country: "KR" }],
    ["get_pageviews", {}, { path: "/paid", referrer: "https://example.com", unit: "hour" }],
    ["get_metrics", { type: "path" }, { path: "/paid", limit: 10, offset: 0 }],
    ["get_events", {}, { path: "/paid", event: "purchase", page: 2 }],
    ["get_sessions", {}, { path: "/paid", distinctId: "user", query: "coupon" }],
    ["get_event_series", { timezone: "UTC" }, { path: "/paid", event: "purchase", limit: 10 }],
    ["get_session_stats", {}, { path: "/paid", referrer: "https://example.com" }],
    ["get_sessions_weekly", { timezone: "UTC" }, { segment: segmentId }],
    ["get_event_values", { type: "path" }, { search: "paid" }],
    ["get_event_data_events", {}, { event: "purchase" }],
    ["get_event_data_fields", {}, { eventName: "purchase" }],
    ["get_event_data_properties", {}, { segment: segmentId }],
    ["get_event_data_values", { propertyName: "total" }, { eventName: "purchase", dataType: 2 }],
    ["get_event_data_stats", {}, { event: "purchase" }],
    ["get_session_data_properties", {}, { propertyName: "plan" }],
    ["get_session_data_values", {}, { propertyName: "plan", dataType: 1 }],
  ]) {
    assert.notEqual((await call(name, { ...range, ...extra, filters: { ...nested, startAt: 99, endAt: 100 } })).isError, true, name);
    const query = calls.pop()[3];
    assert.deepEqual(query, { ...nested, startAt: 1000, endAt: 2000, ...extra }, name);
  }
  await call("get_stats", { ...range, path: "/explicit", filters: { path: "/nested", segment: segmentId } });
  assert.equal(calls.at(-1)[3].path, "/explicit");
  assert.equal(calls.at(-1)[3].segment, segmentId);
  assert.deepEqual(mergeFilters({ a: "old", b: 1, c: "value", d: false }, { a: undefined, b: 0, c: "", d: true }),
    { a: "old", b: 0, c: "", d: true });
});

test("segment create/update preserve the full 3.4 contract and reject unknown nested fields", async (t) => {
  const { calls, call } = await setup(t);
  const property = { propertyName: "plan", dataType: 1, operator: "eq", value: "paid" };
  const parameters = {
    filters: [{ name: "country", operator: "eq", value: "KR" }],
    sessionPropertyFilters: [property], match: "all", dateRange: "30day",
    action: { type: "event", value: "purchase" },
  };
  for (const name of ["create_segment", "update_segment"]) {
    const args = { websiteId, ...(name === "update_segment" ? { segmentId } : {}), type: "segment", name: "Paid", parameters };
    assert.notEqual((await call(name, args)).isError, true);
    assert.deepEqual(calls.pop(), ["POST", `/api/websites/${websiteId}/segments${name === "update_segment" ? `/${segmentId}` : ""}`, { type: "segment", name: "Paid", parameters }]);
    for (const invalid of [
      { unknown: true }, { filters: [{ name: "country", operator: "bad", value: "KR" }] },
      { filters: [{ name: "country", operator: "eq", value: "KR", typo: true }] },
      { sessionPropertyFilters: [{ ...property, dataType: 6 }] },
      { sessionPropertyFilters: [{ ...property, propertyName: "" }] },
      { sessionPropertyFilters: [{ ...property, propertyName: "x".repeat(501) }] },
      { sessionPropertyFilters: [{ ...property, extra: true }] },
      { action: { type: "event" } }, { action: { type: "event", value: "purchase", typo: true } },
    ]) assert.equal((await call(name, { ...args, parameters: invalid })).isError, true, JSON.stringify(invalid));
    assert.equal((await call(name, { ...args, type: "cohort" })).isError, true);
    assert.equal(calls.length, 0);
    for (const dataType of [1, 2, 3, 4, 5]) {
      assert.notEqual((await call(name, { ...args, parameters: { sessionPropertyFilters: [{ ...property, dataType }] } })).isError, true);
      assert.equal(calls.pop()[2].parameters.sessionPropertyFilters[0].dataType, dataType);
    }
    const cohort = { action: { type: "event", value: "purchase" }, sessionPropertyFilters: [] };
    assert.notEqual((await call(name, { ...args, type: "cohort", parameters: cohort })).isError, true);
    assert.deepEqual(calls.pop()[2].parameters, cohort);
  }
});

test("annotation CRUD uses authenticated management routes and validates dates, notes and ranges", async (t) => {
  const { calls, call } = await setup(t);
  const annotationId = segmentId;
  const collection = `/api/websites/${websiteId}/annotations`;
  assert.notEqual((await call("list_annotations", { websiteId, startAt: 0, endAt: 2000, page: 1 })).isError, true);
  assert.deepEqual(calls.pop(), ["GET", collection, undefined, { startAt: 0, endAt: 2000, page: 1 }]);
  assert.notEqual((await call("get_annotation", { websiteId, annotationId })).isError, true);
  assert.deepEqual(calls.pop(), ["GET", `${collection}/${annotationId}`]);
  assert.notEqual((await call("create_annotation", { websiteId, date: "2026-10-20", note: "Release" })).isError, true);
  assert.deepEqual(calls.pop(), ["POST", collection, { date: "2026-10-20", allDay: true, note: "Release" }]);
  assert.notEqual((await call("update_annotation", { websiteId, annotationId, date: "2026-10-20T09:00:00+09:00", allDay: false, note: "Launch" })).isError, true);
  assert.deepEqual(calls.pop(), ["POST", `${collection}/${annotationId}`, { date: "2026-10-20T09:00:00+09:00", allDay: false, note: "Launch" }]);
  assert.notEqual((await call("delete_annotation", { websiteId, annotationId })).isError, true);
  assert.deepEqual(calls.pop(), ["DELETE", `${collection}/${annotationId}`]);
  for (const args of [{ startAt: 0 }, { endAt: 2000 }, { startAt: 2000, endAt: 0 }]) {
    assert.equal((await call("list_annotations", { websiteId, ...args })).isError, true);
  }
  for (const args of [{ date: "invalid", note: "note" }, { date: "2026-02-30", note: "note" }, { date: "2026-10-20", note: "" }, { date: "2026-10-20", note: "x".repeat(501) }]) {
    assert.equal((await call("create_annotation", { websiteId, ...args })).isError, true);
  }
  assert.equal(calls.length, 0);
});

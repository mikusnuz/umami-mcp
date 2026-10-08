import assert from "node:assert/strict";
import test from "node:test";
import { UmamiClient, UmamiTwoFactorRequiredError } from "../dist/client.js";
import { loadConfig } from "../dist/config.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("self-hosted API keys preserve /api and keep collection on the instance", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push({ url: String(url), init });
    return jsonResponse({ ok: true });
  });
  for (const baseUrl of ["https://analytics.example.com", "https://analytics.example.com/api/"]) {
    const config = loadConfig({ UMAMI_URL: baseUrl, UMAMI_API_KEY: "self-hosted-key" });
    const client = new UmamiClient(config);
    assert.equal(client.isCloud, false);
    await client.call("GET", "/api/websites");
    await client.call("POST", "/api/send", { type: "event" }, undefined, {
      auth: "none", target: "collector",
    });
  }
  assert.deepEqual(requests.map(({ url }) => url), [
    "https://analytics.example.com/api/websites",
    "https://analytics.example.com/api/send",
    "https://analytics.example.com/api/websites",
    "https://analytics.example.com/api/send",
  ]);
  assert.equal(requests[0].init.headers.Authorization, "Bearer self-hosted-key");
  assert.equal(requests[1].init.headers.Authorization, undefined);
});

test("deployment mode supports Cloud defaults, regional hosts, proxies, and explicit overrides", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    requests.push(String(url));
    return jsonResponse({});
  });
  for (const env of [
    { UMAMI_API_KEY: "key" },
    { UMAMI_API_KEY: "key", UMAMI_URL: "https://api.umami.is/v1/eu" },
    { UMAMI_API_KEY: "key", UMAMI_MODE: "cloud", UMAMI_URL: "https://proxy.example.com/v1" },
  ]) {
    const config = loadConfig(env);
    assert.equal(config.mode, "cloud");
    assert.equal(config.collectorUrl, "https://cloud.umami.is");
    await new UmamiClient(config).call("GET", "/api/websites");
  }
  assert.deepEqual(requests, [
    "https://api.umami.is/v1/websites",
    "https://api.umami.is/v1/eu/websites",
    "https://proxy.example.com/v1/websites",
  ]);
  assert.equal(loadConfig({ UMAMI_MODE: "self-hosted", UMAMI_API_KEY: "key" }).baseUrl, "");
  assert.equal(loadConfig({ UMAMI_API_KEY: "key", UMAMI_COLLECTOR_URL: "https://collector.example.com/" }).collectorUrl, "https://collector.example.com");
  assert.throws(() => loadConfig({ UMAMI_MODE: "invalid" }), /UMAMI_MODE/);
});

test("Cloud management calls strip /api and use Bearer API-key auth", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (input, init) => {
    requests.push({ url: String(input), init });
    return jsonResponse({ ok: true });
  });
  const client = new UmamiClient({
    baseUrl: "https://api.umami.is/v1",
    collectorUrl: "https://cloud.umami.is",
    username: "",
    password: "",
    apiKey: "cloud-key",
  });

  await client.call("GET", "/api/websites");

  assert.equal(requests[0].url, "https://api.umami.is/v1/websites");
  assert.equal(requests[0].init.headers.Authorization, "Bearer cloud-key");
});

test("public collector calls need no credentials and preserve a raw batch array", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (input, init) => {
    requests.push({ url: String(input), init });
    return jsonResponse({ processed: 1 });
  });
  const client = new UmamiClient({
    baseUrl: "",
    collectorUrl: "https://analytics.example.com",
    username: "",
    password: "",
    apiKey: "",
  });
  const batch = [{ type: "event", payload: { website: "website-id", url: "/" } }];

  await client.call("POST", "/api/batch", batch, undefined, {
    auth: "none",
    target: "collector",
  });

  assert.equal(requests[0].url, "https://analytics.example.com/api/batch");
  assert.equal(requests[0].init.headers.Authorization, undefined);
  assert.match(requests[0].init.headers["User-Agent"], /UmamiMCP/);
  assert.deepEqual(JSON.parse(requests[0].init.body), batch);
});

test("self-hosted 2FA stores the partial token and completes login", async (t) => {
  const requests = [];
  const fullToken = `header.${Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString("base64url")}.signature`;
  t.mock.method(globalThis, "fetch", async (input, init) => {
    requests.push({ url: String(input), init });
    if (String(input).endsWith("/api/auth/login")) {
      return jsonResponse({ requiresTwoFactor: true, partialToken: "partial-token" });
    }
    if (String(input).endsWith("/api/2fa/verify")) {
      return jsonResponse({ token: fullToken, user: { id: "user-id" } });
    }
    return jsonResponse({ id: "user-id" });
  });
  const client = new UmamiClient({
    baseUrl: "https://analytics.example.com",
    collectorUrl: "https://analytics.example.com",
    username: "admin",
    password: "password",
    apiKey: "",
  });

  await assert.rejects(
    client.call("GET", "/api/me"),
    UmamiTwoFactorRequiredError,
  );
  await client.completeTwoFactorLogin({ token: "123456" });
  await client.call("GET", "/api/me");

  assert.equal(requests[1].init.headers.Authorization, "Bearer partial-token");
  assert.deepEqual(JSON.parse(requests[1].init.body), { token: "123456" });
  assert.equal(requests[2].init.headers.Authorization, `Bearer ${fullToken}`);
});

test("self-hosted URLs do not duplicate an explicitly configured /api suffix", async (t) => {
  const calledUrls = [];
  const token = `header.${Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString("base64url")}.signature`;
  t.mock.method(globalThis, "fetch", async (input) => {
    calledUrls.push(String(input));
    if (String(input).endsWith("/api/auth/login")) {
      return jsonResponse({ token });
    }
    return jsonResponse({ ok: true });
  });
  const client = new UmamiClient({
    baseUrl: "https://analytics.example.com/api",
    collectorUrl: "https://analytics.example.com",
    username: "admin",
    password: "password",
    apiKey: "",
  });

  await client.call("GET", "/api/websites");
  assert.deepEqual(calledUrls, [
    "https://analytics.example.com/api/auth/login",
    "https://analytics.example.com/api/websites",
  ]);
});

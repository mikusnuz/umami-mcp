#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, UmamiConfig } from "./config.js";
import { UmamiClient } from "./client.js";
import { registerWebsiteTools } from "./tools/websites.js";
import { registerStatsTools } from "./tools/stats.js";
import { registerSessionTools } from "./tools/sessions.js";
import { registerEventTools } from "./tools/events.js";
import { registerReportTools } from "./tools/reports.js";
import { registerUserTools } from "./tools/users.js";
import { registerTeamTools } from "./tools/teams.js";
import { registerRealtimeTools } from "./tools/realtime.js";
import { registerAccountTools } from "./tools/account.js";
import { registerWebsiteResources } from "./resources/websites.js";
import { registerAccountResources } from "./resources/account.js";
import { registerPrompts } from "./prompts/index.js";

const server = new McpServer({
  name: "umami-mcp",
  version: "1.2.0",
});

const config = loadConfig();
const client = new UmamiClient(config);

// Register all tools
registerWebsiteTools(server, client);
registerStatsTools(server, client);
registerSessionTools(server, client);
registerEventTools(server, client);
registerReportTools(server, client);
registerUserTools(server, client);
registerTeamTools(server, client);
registerRealtimeTools(server, client);
registerAccountTools(server, client);

// Register resources
registerWebsiteResources(server, client);
registerAccountResources(server, client);

// Register prompts
registerPrompts(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

// ── Smithery Sandbox ──

export function createSandboxServer() {
  const sandbox = new McpServer({
    name: "umami-mcp",
    version: "1.2.0",
  });

  const mockConfig: UmamiConfig = {
    baseUrl: "https://example.com",
    username: "",
    password: "",
    apiKey: "",
  };
  const mockClient = new UmamiClient(mockConfig);

  registerWebsiteTools(sandbox, mockClient);
  registerStatsTools(sandbox, mockClient);
  registerSessionTools(sandbox, mockClient);
  registerEventTools(sandbox, mockClient);
  registerReportTools(sandbox, mockClient);
  registerUserTools(sandbox, mockClient);
  registerTeamTools(sandbox, mockClient);
  registerRealtimeTools(sandbox, mockClient);
  registerAccountTools(sandbox, mockClient);
  registerWebsiteResources(sandbox, mockClient);
  registerAccountResources(sandbox, mockClient);
  registerPrompts(sandbox);

  return sandbox;
}

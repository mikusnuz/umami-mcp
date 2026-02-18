import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UmamiClient } from "../client.js";

export function registerAccountResources(server: McpServer, client: UmamiClient) {
  server.resource(
    "account",
    "umami://me",
    { description: "Current authenticated Umami user info", mimeType: "application/json" },
    async () => {
      const data = await client.call("GET", "/api/me");
      return {
        contents: [
          {
            uri: "umami://me",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );
}

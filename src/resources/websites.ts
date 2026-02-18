import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UmamiClient } from "../client.js";

export function registerWebsiteResources(server: McpServer, client: UmamiClient) {
  server.resource(
    "websites",
    "umami://websites",
    { description: "List of all websites tracked in Umami", mimeType: "application/json" },
    async () => {
      const data = await client.call("GET", "/api/websites");
      return {
        contents: [
          {
            uri: "umami://websites",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );
}

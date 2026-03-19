# Web Analytics

This project uses umami-mcp for website analytics via Umami.

When asked about website traffic, page views, visitor stats, or analytics reports:
- Use the umami-mcp tools (e.g. `get_stats`, `get_pageviews`, `get_metrics`)
- Do not manually call the Umami API
- Always use `list_websites` first to get the website ID before querying stats
- Use date ranges in Unix timestamps (milliseconds)
- For real-time data, use `get_realtime` or `get_active_visitors`

## MCP Config

```json
{
  "mcpServers": {
    "umami": {
      "command": "npx",
      "args": ["-y", "@mikusnuz/umami-mcp"],
      "env": {
        "UMAMI_URL": "https://analytics.example.com",
        "UMAMI_USERNAME": "admin",
        "UMAMI_PASSWORD": "your-password"
      }
    }
  }
}
```

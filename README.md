**English** | [한국어](README.ko.md)

# umami-mcp

[![npm version](https://img.shields.io/npm/v/@mikusnuz/umami-mcp)](https://www.npmjs.com/package/@mikusnuz/umami-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Full-coverage **Model Context Protocol (MCP)** server for [Umami Analytics](https://umami.is) API v2.

Unlike existing Umami MCP implementations (read-only, ≤5 tools), this server provides **21 tools**, **2 resources**, and **2 prompts** covering the entire Umami API — websites CRUD, stats, sessions, events, and reports.

## Features

- **21 Tools** — Full CRUD for websites, detailed analytics, session tracking, event sending, and report management
- **2 Resources** — Quick access to website list and account info
- **2 Prompts** — Pre-built analytics workflows (site overview, traffic comparison)
- **Dual Auth** — Self-hosted (username/password → JWT) and Umami Cloud (API key)
- **Lazy Config** — Server starts without credentials; auth is checked on first API call
- **Zero Dependencies** — Uses native `fetch`, no external HTTP libraries

## Installation

```bash
npm install -g @mikusnuz/umami-mcp
```

Or use directly with `npx`:

```bash
npx @mikusnuz/umami-mcp
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `UMAMI_URL` | Yes | Your Umami instance URL (e.g. `https://analytics.example.com`) |
| `UMAMI_USERNAME` | For self-hosted | Login username |
| `UMAMI_PASSWORD` | For self-hosted | Login password |
| `UMAMI_API_KEY` | For Umami Cloud | API key from Umami Cloud dashboard |

### Claude Desktop

Add to your `claude_desktop_config.json`:

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

### Claude Code

```bash
claude mcp add umami -- npx -y @mikusnuz/umami-mcp

# Set environment variables
export UMAMI_URL="https://analytics.example.com"
export UMAMI_USERNAME="admin"
export UMAMI_PASSWORD="your-password"
```

## Tools (21)

### Websites (6)

| Tool | Description |
|------|-------------|
| `list_websites` | List all tracked websites |
| `get_website` | Get website details by ID |
| `create_website` | Create a new website |
| `update_website` | Update website configuration |
| `delete_website` | Delete a website |
| `get_active_visitors` | Get current active visitor count |

### Stats & Analytics (6)

| Tool | Description |
|------|-------------|
| `get_stats` | Summary statistics (pageviews, visitors, bounce rate, etc.) |
| `get_pageviews` | Pageview/session counts over time |
| `get_metrics` | Aggregated metrics (top pages, browsers, countries, etc.) |
| `get_events` | Event data over time |
| `get_sessions` | Session listing with filters |
| `get_daterange` | Available data date range |

### Sessions (3)

| Tool | Description |
|------|-------------|
| `get_session` | Session details |
| `get_session_activity` | Session activity log |
| `get_session_properties` | Session custom properties |

### Events (2)

| Tool | Description |
|------|-------------|
| `send_event` | Send custom events/pageviews (server-side tracking) |
| `get_event_values` | Event/session property values |

### Reports (4)

| Tool | Description |
|------|-------------|
| `list_reports` | List saved reports |
| `get_report` | Get report details |
| `create_report` | Create and save a report |
| `run_report` | Execute a report (funnel, retention, utm, goals, insights, revenue, journey) |

## Resources (2)

| Resource | URI | Description |
|----------|-----|-------------|
| Websites | `umami://websites` | All tracked websites |
| Account | `umami://me` | Current user info |

## Prompts (2)

| Prompt | Description |
|--------|-------------|
| `site_overview` | Comprehensive site analysis (stats + pageviews + top metrics + active visitors) |
| `traffic_compare` | Compare traffic between two date ranges |

## Usage Examples

### Get website statistics
```
Use get_stats to show me the last 7 days of analytics for my main website.
```

### Compare periods
```
Use the traffic_compare prompt to compare last week vs this week for website abc-123.
```

### Send server-side event
```
Use send_event to track a "signup" event on my website with data { plan: "pro" }.
```

## Development

```bash
git clone https://github.com/mikusnuz/umami-mcp.git
cd umami-mcp
npm install
npm run build
```

## License

MIT

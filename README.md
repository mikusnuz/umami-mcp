**English** | [한국어](README.ko.md)

# umami-mcp

[![npm version](https://img.shields.io/npm/v/@mikusnuz/umami-mcp)](https://www.npmjs.com/package/@mikusnuz/umami-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Badge](https://lobehub.com/badge/mcp/mikusnuz-umami-mcp)](https://lobehub.com/mcp/mikusnuz-umami-mcp)

Full-coverage **Model Context Protocol (MCP)** server for [Umami Analytics](https://umami.is) API v2.

Unlike existing Umami MCP implementations (read-only, ≤5 tools), this server provides **66 tools**, **2 resources**, and **2 prompts** covering the entire Umami API — websites CRUD, stats, sessions, events, event-data, session-data, reports, user management, teams, realtime, account, and more.

## When to Use

Use this MCP when you need to:

- **"Show me website analytics for the last 7 days"** — get stats, pageviews, and metrics with date filters
- **"Which pages got the most views this month?"** — query aggregated metrics by URL
- **"Compare traffic between two date ranges"** — use the traffic_compare prompt or get_stats with different ranges
- **"Set up a new website in Umami"** — create and configure tracked websites
- **"Get real-time active visitors"** — check active visitors and real-time data
- **"Export analytics report"** — create, run, and retrieve reports (funnel, retention, UTM, goals, revenue, attribution)
- **"Track a custom event from the server"** — send events or batch events programmatically
- **"Manage team access to analytics"** — create teams, add users and websites to teams

## Features

- **66 Tools** — Full CRUD for websites, detailed analytics, session tracking, event sending & event-data queries, report management (including attribution), user/team administration, team-website management, account management, batch events, and realtime monitoring
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

## Tools (66)

### Websites (9)

| Tool | Description |
|------|-------------|
| `list_websites` | List all tracked websites |
| `get_website` | Get website details by ID |
| `create_website` | Create a new website |
| `update_website` | Update website configuration |
| `delete_website` | Delete a website |
| `get_active_visitors` | Get current active visitor count |
| `reset_website` | Reset all analytics data for a website |
| `transfer_website` | Transfer website ownership to another user |
| `get_website_reports` | Get all reports for a website |

### Stats & Analytics (9)

| Tool | Description |
|------|-------------|
| `get_stats` | Summary statistics (pageviews, visitors, bounce rate, etc.) |
| `get_pageviews` | Pageview/session counts over time |
| `get_metrics` | Aggregated metrics (top pages, browsers, countries, etc.) |
| `get_events` | Event data over time |
| `get_sessions` | Session listing with filters |
| `get_daterange` | Available data date range |
| `get_event_series` | Event metrics over time (event series) |
| `get_session_stats` | Summarized session statistics |
| `get_sessions_weekly` | Weekly session data |

### Sessions (5)

| Tool | Description |
|------|-------------|
| `get_session` | Session details |
| `get_session_activity` | Session activity log |
| `get_session_properties` | Session custom properties |
| `get_session_data_properties` | Session data property names and types |
| `get_session_data_values` | Session data aggregated values |

### Events (7)

| Tool | Description |
|------|-------------|
| `send_event` | Send custom events/pageviews (server-side tracking) |
| `get_event_values` | Event/session property values |
| `get_event_data_events` | Event data events (custom event names and counts) |
| `get_event_data_fields` | Event data fields (property keys and types) |
| `get_event_data_values` | Event data values (aggregated counts for a property) |
| `get_event_data_stats` | Event data statistics summary |
| `batch_events` | Send multiple events in a single batch request |

### Reports (6)

| Tool | Description |
|------|-------------|
| `list_reports` | List saved reports |
| `get_report` | Get report details |
| `create_report` | Create and save a report |
| `update_report` | Update an existing report |
| `delete_report` | Delete a saved report |
| `run_report` | Execute a report (funnel, retention, utm, goals, insights, revenue, journey, attribution) |

### Users (8, admin only)

| Tool | Description |
|------|-------------|
| `list_users` | List all users |
| `create_user` | Create a new user (username, password, role) |
| `get_user` | Get user details |
| `update_user` | Update user (username, password, or role) |
| `delete_user` | Delete a user |
| `get_user_websites` | List websites a user has access to |
| `get_user_usage` | Get usage statistics for a user |
| `get_user_teams` | List teams a user belongs to |

### Teams (14)

| Tool | Description |
|------|-------------|
| `list_teams` | List all teams |
| `create_team` | Create a new team |
| `get_team` | Get team details |
| `update_team` | Update team name |
| `delete_team` | Delete a team |
| `join_team` | Join a team using an access code |
| `list_team_users` | List team members |
| `get_team_user` | Get details of a specific team member |
| `add_team_user` | Add a user to a team |
| `update_team_user` | Update a team member's role |
| `remove_team_user` | Remove a user from a team |
| `list_team_websites` | List websites belonging to a team |
| `add_team_website` | Add a website to a team |
| `remove_team_website` | Remove a website from a team |

### Account (7)

| Tool | Description |
|------|-------------|
| `get_me` | Get current authenticated user profile |
| `get_my_websites` | List current user's websites |
| `get_my_teams` | List current user's teams |
| `update_my_password` | Update current user's password |
| `verify_auth` | Verify authentication token is valid |
| `get_share` | Get shared website data by share ID |
| `heartbeat` | Check if Umami server is healthy |

### Realtime (1)

| Tool | Description |
|------|-------------|
| `get_realtime` | Real-time data for last 30 minutes (visitors, URLs, referrers, countries, events) |

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

### Batch multiple events
```
Use batch_events to send 3 pageview events for different pages on my website.
```

### Check server health
```
Use heartbeat to check if the Umami server is running.
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

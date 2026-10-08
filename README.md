**English** | [한국어](README.ko.md)

# umami-mcp

Model Context Protocol server for the **Umami Analytics v3 API**.
It supports self-hosted username/password or API-key authentication and Umami
Cloud API keys, and exposes analytics, collection, administration, and v3 feature
families such as boards, links, pixels, segments, session replay, shares,
exports, performance, and revenue.

This version intentionally does not claim every private Umami route. Its tools
track the documented API, including Umami 3.4 API-key authentication. Report
tools use the legacy report contracts that Umami 3.4 continues to support.

## Requirements

- Node.js 18 or newer
- Umami v3.3-compatible self-hosted instance (3.4+ for API keys), or Umami Cloud

## Installation

```bash
npm install -g @mikusnuz/umami-mcp
```

Or run it directly:

```bash
npx -y @mikusnuz/umami-mcp
```

## Configuration

### Self-hosted

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

`UMAMI_URL` is the instance origin. A trailing `/api` is accepted, but is not
required.

On Umami 3.4+, create an API key under Settings → API keys and replace
`UMAMI_USERNAME` and `UMAMI_PASSWORD` with `UMAMI_API_KEY`. Set
`UMAMI_MODE` to `self-hosted` to select the deployment mode explicitly.

### Umami Cloud

```json
{
  "mcpServers": {
    "umami": {
      "command": "npx",
      "args": ["-y", "@mikusnuz/umami-mcp"],
      "env": {
        "UMAMI_API_KEY": "your-cloud-api-key"
      }
    }
  }
}
```

Cloud management calls default to `https://api.umami.is/v1`; tool paths are
translated from self-hosted `/api/...` paths to Cloud `/v1/...` paths. Set
`UMAMI_URL` to `https://api.umami.is/v1/us` or
`https://api.umami.is/v1/eu` when an explicit Cloud region is required.
For a Cloud API proxy on another hostname, also set `UMAMI_MODE` to `cloud`.

### Environment variables

| Variable | When required | Description |
|---|---|---|
| `UMAMI_MODE` | Optional | `self-hosted` or `cloud`; auto-detected when omitted |
| `UMAMI_URL` | Self-hosted | Instance origin; optional for Cloud |
| `UMAMI_USERNAME` | Without a self-hosted API key | Login username |
| `UMAMI_PASSWORD` | Without a self-hosted API key | Login password |
| `UMAMI_API_KEY` | Cloud; optional for self-hosted 3.4+ | Bearer API key |
| `UMAMI_COLLECTOR_URL` | Optional | Separate host for public collection/share/heartbeat/recorder routes |

For Cloud, the collector defaults to `https://cloud.umami.is`. For self-hosted
Umami it defaults to `UMAMI_URL`.
An API key without `UMAMI_URL`, or a URL on `api.umami.is`, selects Cloud.
Any other configured URL selects self-hosted mode, even when using an API key.

## Authentication and public routes

Management and analytics tools send a bearer token. The client logs in to a
self-hosted instance lazily and caches the returned JWT when using a password.
API keys are sent directly as the bearer credential on both deployment types.

The public collection routes do not require credentials:

- `send_event`, `send_identify`, `send_performance`
- `batch_events` (raw JSON array, up to 500 items)
- `heartbeat`, `get_share`, `get_recorder_config`

If self-hosted login reports that two-factor authentication is required, call
`complete_two_factor_login` with a current TOTP or backup code, then retry the
original tool. Setup and policy tools are also exposed for self-hosted Umami.

Umami Cloud does not expose `/me/password`, `/users`, or `/users/*` through an
API key. Those tools are for self-hosted instances.

## Tool groups

| Area | Representative tools |
|---|---|
| Websites | `list_websites`, CRUD, reset, transfer to user/team, replay configuration |
| Analytics | `get_stats`, `get_pageviews`, `get_metrics`, `get_events`, `get_sessions`, event series |
| Event/session data | event values, fields, properties, values, session activity |
| Collection | event/pageview, identify, performance, raw batch, link/pixel events |
| Reports | saved-report CRUD and `run_report` for attribution, breakdown, funnel, goal, heatmap, journey, performance, retention, revenue, and UTM |
| Boards | list, CRUD, clone, and team boards |
| Links and pixels | list, CRUD, charts, and collection events |
| Segments | segment/cohort list and CRUD |
| Replay | recorder config, replay list/detail, saved replays, session replays |
| Shares and export | public share resolution, managed website shares, update/delete, CSV ZIP export |
| Revenue | stats, chart, metrics, and revenue sessions |
| Users and teams | current admin-user and team membership/transfer routes |
| 2FA | login completion, enrollment, disable, and admin enforcement policies |
| Realtime | `get_realtime` |

Use MCP `tools/list` for the complete, machine-readable list and schemas.

## Important v3 contract details

- A pageview is sent as `{ "type": "event" }` with no event `name`; the old
  `pageview` type is no longer valid.
- `/api/batch` receives the event objects as a raw array, not
  `{ "events": [...] }`. The tool returns Umami's `processed`, `errors`, and
  per-item `details` fields and marks partial failures as an MCP error result.
- Collector calls set a stable non-bot `User-Agent` header as required by
  Umami; `send_event` and batch items may also supply the visitor's
  `userAgent` and trusted server-side `ip` in the payload.
- Analytics URL filters and page metrics use `path`; the old `url` metric was
  removed. Host aggregation uses `hostname`.
- Supported time units are `minute`, `hour`, `day`, `month`, and `year`.
- `get_event_series` and `get_sessions_weekly` require an IANA timezone.
- `list_reports` requires `websiteId`; report execution sends
  `{ websiteId, type, filters, parameters }`.
- Team website membership is changed through `transfer_website`; the removed
  team-website POST/DELETE routes are not exposed.

## Development

```bash
npm install
npm test
```

`npm test` builds the TypeScript server, checks Cloud/self-hosted URL and auth
behavior, verifies raw public batch requests and the 2FA login flow, and
validates key MCP schemas.

## Official references

- [Umami API overview](https://docs.umami.is/docs/api)
- [Authentication](https://docs.umami.is/docs/api/authentication)
- [Cloud API keys](https://docs.umami.is/docs/cloud/api-key)
- [Sending statistics](https://docs.umami.is/docs/api/sending-stats)
- [Website statistics](https://docs.umami.is/docs/api/website-stats)
- [Reports](https://docs.umami.is/docs/api/reports)
- [Cloud/API changelog](https://docs.umami.is/docs/cloud/changelog)
- [Umami v3.4.0 server source](https://github.com/umami-software/umami/tree/v3.4.0)
- [Report API compatibility](https://github.com/umami-software/umami/blob/v3.4.0/docs/report-api-migration.md)

## License

MIT

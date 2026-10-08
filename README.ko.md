[English](README.md) | **한국어**

# umami-mcp

**Umami Analytics v3 API**용 Model Context Protocol 서버입니다.
셀프 호스팅 아이디/비밀번호 또는 API 키 인증과 Umami Cloud API 키를 지원하며, 분석과
수집 API뿐 아니라 boards, links, pixels, segments, session replay, shares,
export, performance, revenue 같은 v3 기능군을 제공합니다.

문서화되지 않은 사설 라우트까지 전부 지원한다고 주장하지 않습니다. 공개
문서와 서버 계약을 기준으로 도구를 관리하며 Umami 3.4의 API 키 인증도 지원합니다.
보고서 도구는 Umami 3.4에서 계속 지원하는 기존 보고서 계약을 사용합니다.

## 설치

```bash
npm install -g @mikusnuz/umami-mcp
# 또는
npx -y @mikusnuz/umami-mcp
```

## 설정

### 셀프 호스팅

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

`UMAMI_URL`에는 인스턴스 주소를 지정합니다. 끝의 `/api`는 있어도 되고 없어도
됩니다.

Umami 3.4 이상에서는 설정 → API keys에서 키를 생성하고 `UMAMI_USERNAME`과
`UMAMI_PASSWORD` 대신 `UMAMI_API_KEY`를 지정할 수 있습니다.
`UMAMI_MODE=self-hosted`로 배포 유형을 명시할 수도 있습니다.

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

Cloud 관리 API는 기본적으로 `https://api.umami.is/v1`을 사용하고 셀프 호스팅
형식의 `/api/...` 도구 경로를 Cloud `/v1/...` 경로로 변환합니다. 특정 리전이
필요하면 `UMAMI_URL`을 `https://api.umami.is/v1/us` 또는
`https://api.umami.is/v1/eu`로 지정하세요.
다른 호스트의 Cloud API 프록시를 사용한다면 `UMAMI_MODE=cloud`도 지정하세요.

| 환경 변수 | 필요한 경우 | 설명 |
|---|---|---|
| `UMAMI_MODE` | 선택 | `self-hosted` 또는 `cloud`. 생략하면 주소로 판단 |
| `UMAMI_URL` | 셀프 호스팅 | 인스턴스 주소. Cloud에서는 생략 가능 |
| `UMAMI_USERNAME` | 셀프 호스팅 API 키를 쓰지 않을 때 | 로그인 아이디 |
| `UMAMI_PASSWORD` | 셀프 호스팅 API 키를 쓰지 않을 때 | 로그인 비밀번호 |
| `UMAMI_API_KEY` | Cloud 필수; 셀프 호스팅 3.4+ 선택 | Bearer API 키 |
| `UMAMI_COLLECTOR_URL` | 선택 | 공개 수집/share/heartbeat/recorder용 별도 호스트 |

Cloud collector 기본값은 `https://cloud.umami.is`이고, 셀프 호스팅에서는
`UMAMI_URL`을 사용합니다.
API 키만 설정하거나 `api.umami.is` 주소를 사용하면 Cloud로 판단합니다.
다른 주소를 지정하면 API 키 사용 여부와 관계없이 셀프 호스팅으로 판단합니다.

## 인증과 공개 라우트

관리·분석 도구는 bearer token을 전송합니다. 셀프 호스팅은 필요할 때 로그인해
JWT를 캐시합니다. API 키를 설정하면 두 배포 유형 모두 키를 직접 전송합니다.

다음 공개 라우트에는 인증을 강제하지 않습니다.

- `send_event`, `send_identify`, `send_performance`
- `batch_events`(원시 JSON 배열, 최대 500개)
- `heartbeat`, `get_share`, `get_recorder_config`

셀프 호스팅 로그인에서 2FA를 요구하면 `complete_two_factor_login`에 현재 TOTP
또는 백업 코드를 전달한 뒤 원래 도구를 다시 호출하세요. 2FA 등록·해제·정책
도구도 제공합니다.

Cloud API 키는 `/me/password`, `/users`, `/users/*`를 지원하지 않습니다. 해당
도구는 셀프 호스팅 전용입니다.

## 주요 도구군

| 영역 | 지원 내용 |
|---|---|
| 웹사이트·분석 | 웹사이트 CRUD, stats, pageviews, metrics, events, sessions, realtime |
| 수집 | 페이지뷰/이벤트, identify, Core Web Vitals, batch, link/pixel 이벤트 |
| 보고서 | 저장 보고서 CRUD와 attribution, breakdown, funnel, goal, heatmap, journey, performance, retention, revenue, UTM 실행 |
| v3 엔터티 | boards, links, pixels, segments/cohorts |
| Replay | recorder 설정, replay 목록/상세, 저장 replay, 세션별 replay |
| 공유·내보내기 | 공개 share, 관리 share, CSV ZIP export |
| Revenue | stats, chart, metrics, sessions |
| 관리 | 현재 users/teams 라우트, 웹사이트의 user/team 이전, 2FA 정책 |

전체 도구명과 입력 스키마는 MCP `tools/list`에서 확인할 수 있습니다.

## v3에서 중요한 변경점

- 페이지뷰는 이름 없는 `{ "type": "event" }`로 보냅니다. 예전 `pageview`
  타입은 유효하지 않습니다.
- `/api/batch` 본문은 `{ "events": [...] }`가 아니라 이벤트 객체의 원시
  배열입니다. 도구는 Umami의 `processed`, `errors`, 항목별 `details`를
  그대로 반환하며 부분 실패가 있으면 MCP 오류 결과로 표시합니다.
- Umami 요구사항에 맞춰 수집 요청에는 안정적인 비봇 `User-Agent` 헤더를
  설정합니다. `send_event`와 배치 항목에는 방문자의 `userAgent` 및 신뢰할
  수 있는 서버 측 `ip`도 전달할 수 있습니다.
- URL 필터/페이지 지표는 `path`, 호스트 지표는 `hostname`을 사용합니다.
- 시간 단위는 `minute`, `hour`, `day`, `month`, `year`입니다.
- `get_event_series`, `get_sessions_weekly`에는 IANA timezone이 필수입니다.
- `list_reports`에는 `websiteId`가 필요하고, 보고서 실행 본문은
  `{ websiteId, type, filters, parameters }`입니다.
- 팀 웹사이트 소속은 `transfer_website`로 변경합니다. 삭제된 팀-웹사이트
  POST/DELETE 라우트는 노출하지 않습니다.

## 개발

```bash
npm install
npm test
```

## 공식 문서

- [Umami API 개요](https://docs.umami.is/docs/api)
- [인증](https://docs.umami.is/docs/api/authentication)
- [Cloud API 키](https://docs.umami.is/docs/cloud/api-key)
- [통계 전송](https://docs.umami.is/docs/api/sending-stats)
- [웹사이트 통계](https://docs.umami.is/docs/api/website-stats)
- [보고서](https://docs.umami.is/docs/api/reports)
- [Cloud/API 변경 기록](https://docs.umami.is/docs/cloud/changelog)
- [Umami v3.4.0 서버 소스](https://github.com/umami-software/umami/tree/v3.4.0)
- [보고서 API 호환성](https://github.com/umami-software/umami/blob/v3.4.0/docs/report-api-migration.md)

## 라이선스

MIT

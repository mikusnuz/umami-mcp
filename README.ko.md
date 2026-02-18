[English](README.md) | **한국어**

# umami-mcp

[![npm version](https://img.shields.io/npm/v/@mikusnuz/umami-mcp)](https://www.npmjs.com/package/@mikusnuz/umami-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Badge](https://lobehub.com/badge/mcp/mikusnuz-umami-mcp)](https://lobehub.com/mcp/mikusnuz-umami-mcp)

[Umami Analytics](https://umami.is) API v2를 전체 지원하는 **Model Context Protocol (MCP)** 서버입니다.

기존 Umami MCP 구현체(읽기 전용, 도구 5개 이하)와 달리, 이 서버는 **39개 도구**, **2개 리소스**, **2개 프롬프트**를 제공하여 웹사이트 CRUD, 통계, 세션, 이벤트, 리포트, 유저/팀 관리, 실시간 데이터 등 Umami API 전체를 커버합니다.

## 주요 기능

- **39개 도구** — 웹사이트 전체 CRUD, 상세 분석, 세션 추적, 이벤트 전송, 리포트 관리, 유저/팀 관리, 실시간 모니터링
- **2개 리소스** — 웹사이트 목록 및 계정 정보 빠른 조회
- **2개 프롬프트** — 사전 구성된 분석 워크플로 (사이트 개요, 트래픽 비교)
- **이중 인증** — 셀프 호스팅(아이디/비밀번호 → JWT) 및 Umami Cloud(API 키) 지원
- **지연 설정** — 자격 증명 없이 서버 시작 가능; 인증은 첫 API 호출 시 확인
- **의존성 없음** — 네이티브 `fetch` 사용, 외부 HTTP 라이브러리 불필요

## 설치

```bash
npm install -g @mikusnuz/umami-mcp
```

또는 `npx`로 바로 실행:

```bash
npx @mikusnuz/umami-mcp
```

## 설정

### 환경 변수

| 변수 | 필수 여부 | 설명 |
|------|-----------|------|
| `UMAMI_URL` | 필수 | Umami 인스턴스 URL (예: `https://analytics.example.com`) |
| `UMAMI_USERNAME` | 셀프 호스팅 시 | 로그인 사용자명 |
| `UMAMI_PASSWORD` | 셀프 호스팅 시 | 로그인 비밀번호 |
| `UMAMI_API_KEY` | Umami Cloud 시 | Umami Cloud 대시보드의 API 키 |

### Claude Desktop

`claude_desktop_config.json`에 다음을 추가합니다.

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

# 환경 변수 설정
export UMAMI_URL="https://analytics.example.com"
export UMAMI_USERNAME="admin"
export UMAMI_PASSWORD="your-password"
```

## 도구 (39개)

### 웹사이트 (6개)

| 도구 | 설명 |
|------|------|
| `list_websites` | 추적 중인 모든 웹사이트 목록 조회 |
| `get_website` | ID로 웹사이트 상세 정보 조회 |
| `create_website` | 새 웹사이트 생성 |
| `update_website` | 웹사이트 설정 수정 |
| `delete_website` | 웹사이트 삭제 |
| `get_active_visitors` | 현재 활성 방문자 수 조회 |

### 통계 및 분석 (6개)

| 도구 | 설명 |
|------|------|
| `get_stats` | 요약 통계 (페이지뷰, 방문자, 이탈률 등) |
| `get_pageviews` | 시간별 페이지뷰/세션 수 |
| `get_metrics` | 집계 지표 (인기 페이지, 브라우저, 국가 등) |
| `get_events` | 시간별 이벤트 데이터 |
| `get_sessions` | 필터 조건이 있는 세션 목록 |
| `get_daterange` | 사용 가능한 데이터 날짜 범위 |

### 세션 (3개)

| 도구 | 설명 |
|------|------|
| `get_session` | 세션 상세 정보 |
| `get_session_activity` | 세션 활동 로그 |
| `get_session_properties` | 세션 커스텀 속성 |

### 이벤트 (2개)

| 도구 | 설명 |
|------|------|
| `send_event` | 커스텀 이벤트/페이지뷰 전송 (서버 사이드 추적) |
| `get_event_values` | 이벤트/세션 속성 값 조회 |

### 리포트 (4개)

| 도구 | 설명 |
|------|------|
| `list_reports` | 저장된 리포트 목록 |
| `get_report` | 리포트 상세 정보 |
| `create_report` | 리포트 생성 및 저장 |
| `run_report` | 리포트 실행 (funnel, retention, utm, goals, insights, revenue, journey) |

### 유저 (7개, 관리자 전용)

| 도구 | 설명 |
|------|------|
| `list_users` | 전체 유저 목록 조회 |
| `create_user` | 유저 생성 (사용자명, 비밀번호, 역할) |
| `get_user` | 유저 상세 정보 조회 |
| `update_user` | 유저 수정 (사용자명, 비밀번호 또는 역할) |
| `delete_user` | 유저 삭제 |
| `get_user_websites` | 유저가 접근 가능한 웹사이트 목록 |
| `get_user_usage` | 유저 사용량 통계 |

### 팀 (10개)

| 도구 | 설명 |
|------|------|
| `list_teams` | 전체 팀 목록 조회 |
| `create_team` | 팀 생성 |
| `get_team` | 팀 상세 정보 조회 |
| `update_team` | 팀 이름 수정 |
| `delete_team` | 팀 삭제 |
| `join_team` | 액세스 코드로 팀 참가 |
| `list_team_users` | 팀 멤버 목록 |
| `add_team_user` | 팀에 유저 추가 |
| `update_team_user` | 팀 멤버 역할 수정 |
| `remove_team_user` | 팀에서 유저 제거 |

### 실시간 (1개)

| 도구 | 설명 |
|------|------|
| `get_realtime` | 최근 30분 실시간 데이터 (방문자, URL, 리퍼러, 국가, 이벤트) |

## 리소스 (2개)

| 리소스 | URI | 설명 |
|--------|-----|------|
| Websites | `umami://websites` | 추적 중인 모든 웹사이트 |
| Account | `umami://me` | 현재 사용자 정보 |

## 프롬프트 (2개)

| 프롬프트 | 설명 |
|----------|------|
| `site_overview` | 종합 사이트 분석 (통계 + 페이지뷰 + 인기 지표 + 활성 방문자) |
| `traffic_compare` | 두 날짜 범위 간 트래픽 비교 |

## 사용 예시

### 웹사이트 통계 조회
```
Use get_stats to show me the last 7 days of analytics for my main website.
```

### 기간 비교
```
Use the traffic_compare prompt to compare last week vs this week for website abc-123.
```

### 서버 사이드 이벤트 전송
```
Use send_event to track a "signup" event on my website with data { plan: "pro" }.
```

## 개발

```bash
git clone https://github.com/mikusnuz/umami-mcp.git
cd umami-mcp
npm install
npm run build
```

## 라이선스

MIT

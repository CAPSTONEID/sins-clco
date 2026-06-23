# 단계별 추천 스킬 / MCP 카탈로그

각 단계에서 사용자에게 "추가할 스킬/MCP 있나요?" 물을 때 이 표로 후보 제시. 환경에 실제 존재하는 것만 추천. 없으면 일반론으로 안내.

## §트리거 (단계 1)

| 패턴 | 추천 도구 | 비고 |
|------|-----------|------|
| Cron | `scheduled-tasks` MCP, `/schedule` 스킬, `CronCreate` | 정해진 시각 배치 |
| Heartbeat | `/loop` 스킬, `Monitor` 도구, 백그라운드 Bash | 짧은 주기 폴링 |
| Hook | GitHub(`gh`), Slack 커넥터, CI 웹훅, settings.json hooks | 이벤트 반응 |
| Goal | Workflow 도구(루프 오케스트레이션) | 성공조건까지 반복 |

## §행동 (단계 2)

| 작업 도메인 | 추천 스킬/MCP |
|-------------|---------------|
| 코드 작성·수정 | `/review`, `/ship`, `/land-and-deploy`, subagent(general-purpose) |
| 디버깅 | `/investigate`, superpowers-systematic-debugging |
| 웹 브라우징/스크래핑 | `/browse`, `gstack-scrape`, `insane-search` |
| 디자인/UI | `omd-*` 스킬군, `claude-design` |
| 마케팅/콘텐츠 | `sins-marketing-team`, `sins-card-news-creator` |
| 문서 처리 | `anthropic-skills:pdf/docx/xlsx` |
| 파일/DB 접근 | 파일시스템 MCP, DB 커넥터(Notion 등) |
| 외부 API | `mcp-registry`로 커넥터 탐색 |

## §검증 (단계 3) — 결정론적 체크

| 검증 종류 | 도구 |
|-----------|------|
| 테스트 실행 | `pytest`/`npm test` 등 + exit code |
| 린트/타입 | ruff/eslint/mypy/tsc |
| 성능 회귀 | `gstack-benchmark` |
| 렌더 검증 | `/verify`, Preview MCP, gstack browse |
| 코드 리뷰 | `/code-review`, `/review` |

## §정지 / 에스컬레이션 (단계 4)

| 용도 | 도구 |
|------|------|
| 사람 호출 알림 | `PushNotification`, Slack 커넥터, 이메일 |
| 예산/반복 추적 | 러너 스크립트 내장 카운터(외부 의존 X) |
| 상태 체크포인트 | JSON 파일, git 커밋 |

## §아키텍처 (단계 5)

| 구성요소 | 도구 |
|----------|------|
| Worktree 격리 | `EnterWorktree`/`ExitWorktree`, superpowers-using-git-worktrees |
| 상태 영속화 | gbrain(`gstack-setup-gbrain`), JSON 체크포인트 |
| 서브에이전트 | Agent 도구(general-purpose/Explore/Plan), 커스텀 agent 정의 |
| 병렬 오케스트레이션 | Workflow 도구(pipeline/parallel) |
| 비용 라우팅 | 모델별 호출 분기(haiku 분류 / sonnet 초안 / opus 결정) |

## 추천 원칙

- **최소 매칭만.** 작업 신호에 직접 닿는 도구 1~2개만 권함. 과잉 추천 금지.
- 환경에 없는 도구는 "설치 필요" 표시하고 일반 대안 제시.
- MCP는 `mcp-registry` 검색으로 실제 가용성 확인 가능.

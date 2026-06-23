# 루프 엔지니어링 참고서

## 1. 정의

에이전트를 프롬프트하지 않는다. 에이전트를 **프롬프트하는 시스템**을 설계한다. 트리거 → 행동 → 평가 → 반복. 사람 키보드 없이 자율·비동기 작동.

진화 계보: Prompt(22~24) → Context(25) → Harness(26) → **Loop(26)**.

## 2. 4대 루프 패턴

| 패턴 | 트리거 | 용도 | 예시 | 필수 가드 |
|------|--------|------|------|-----------|
| **Heartbeat** | 짧은 주기(초~분) | 모니터링 | "5분마다 에러로그 체크, 1%↑면 이슈 발행" | 주기·중복알림 억제 |
| **Cron** | 정해진 시각 | 배치 | "평일 10시 의존성 감사·코드리뷰" | 시각·중복실행 잠금 |
| **Hook** | 이벤트(PR push, CI fail, Slack) | 반응형 | 트리거당 1회 실행 | 디바운스·멱등성 |
| **Goal** | 성공조건 충족까지 | 오픈엔드(리팩터·마이그레이션) | 테스트 통과까지 반복 | `stop_condition` + `max_iterations` **필수** |

## 3. 캐노니컬 루프 구조

```python
state = init_state(goal)
for step in range(MAX_STEPS):
    thought = model.reason(state)
    action  = model.choose_action(state)
    result  = tools.execute(action)
    state   = update(state, thought, action, result)
    state   = compact(state)                    # 컨텍스트 압축
    if verifier.passes(state):                  # 결정론적 검증
        return success(state)
    if no_progress(state) or budget.exhausted():
        return escalate_to_human(state)         # 무한루프 대신 사람 호출
```

## 4. 아키텍처 구성요소

- **Worktrees** — 격리된 git 복사본, 메인 브랜치 오염 방지
- **Skills** — 버전관리된 재사용 지시셋
- **Connectors (MCP)** — 외부 도구 접근. 수평 위임은 A2A 프로토콜
- **Subagents** — 격리된 컨텍스트 윈도우 가진 전문 워커
- **State Tracking** — JSON 체크포인트/git 히스토리로 중복반복 차단

## 5. 핵심 노하우

**검증이 곧 신호 (1순위)**
- 모델 자기평가 ❌ → 결정론적 체크(테스트·린터·타입체커·exit code) ✅
- 좋은 목표: "테스트 통과시켜"(체크 가능) / 나쁜 목표: "코드 개선해"(모호)

**정지조건 다층화**
- 결정론적 검증 통과
- `max_iterations` 하드캡 (시작값 50)
- 토큰/벽시계 예산
- no-progress 감지 — 최근 스텝 동일 에러·무변화면 중단

**컨텍스트 관리**
- 매 반복 fresh subagent 스폰 (단일 윈도우 누적 금지 → context rot 방지)
- 오래된 스텝 요약 압축, 낡은 출력 prune, 상태는 파일로 externalize

**비용 최적화**
- 작업복잡도별 모델 라우팅: 분류=저가($0.1~0.3/1M), 초안=중간($1~3), 결정=프론티어($10~15)
- 프롬프트 캐싱 결합 시 60~80% 절감

**추론 패턴 선택**
- ReAct(기본) → Reflexion(자기비판+에피소드 메모리) → Plan-and-Execute(계획·실행 분리) → Evaluator-Optimizer(생성+피드백 쌍)

## 6. 피해야 할 함정

context rot · 무한루프 · **reward hacking**(엉뚱한 프록시 최적화) · 환각성 성공선언 · 에러 복리누적 · 비용 폭발. → 모델 순응 기대 말고 **아키텍처로 강제**.

## 7. 시작 권장

2스텝(observe→act) → refinement 로직 추가 → routine 추가 식 점진 확장.

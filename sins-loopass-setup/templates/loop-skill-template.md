---
name: {{LOOP_NAME}}
description: {{ONE_LINE_GOAL}} — {{PATTERN}} 패턴 자율 루프. 트리거 {{TRIGGER}}. 검증 {{VERIFY_CMD}}. 트리거 — "{{LOOP_NAME}} 실행", "{{LOOP_NAME}} 루프 돌려".
---

# {{LOOP_NAME}} — {{PATTERN}} 루프

## 목표
{{ONE_LINE_GOAL}}
검증 가능 성공조건: {{SUCCESS_CRITERIA}}

## 트리거
- 패턴: {{PATTERN}}
- 구체값: {{TRIGGER}}
- 구동: {{TRIGGER_MECHANISM}}   <!-- Cron→/schedule, Hook→hook 설정, Heartbeat→/loop -->

## 매 반복 행동
- 실행 주체: {{ACTOR}}            <!-- 메인 / fresh subagent / 전문 subagent -->
- 추론 패턴: {{REASONING}}        <!-- ReAct / Reflexion / Plan-and-Execute / Evaluator-Optimizer -->
- 절차:
  1. observe — {{OBSERVE_STEP}}
  2. act — {{ACT_STEP}}

## 검증 (결정론적 — 모델 자기평가 금지)
```bash
{{VERIFY_CMD}}
```
exit 0 = 성공 종료 신호.

## 정지조건 (전부 러너에 박힘)
- 검증 통과 → success
- max_iterations = {{MAX_ITERATIONS}}
- 예산 = {{BUDGET}}
- no-progress = 최근 {{NO_PROGRESS_N}}스텝 무변화 → escalate
- 에스컬레이션 통로: {{ESCALATION}}

## 아키텍처
- 격리: {{WORKTREE}}
- 상태: {{STATE_TRACKING}}
- 컨텍스트 압축: {{COMPACT}}
- 비용 라우팅: {{MODEL_ROUTING}}

## 의존성 (스킬 / MCP)
{{DEPENDENCIES}}

## 실행
```bash
python3 loop_runner.py \
  --verify-cmd "{{VERIFY_CMD}}" \
  --max-iterations {{MAX_ITERATIONS}} \
  --budget {{BUDGET}} \
  --no-progress-n {{NO_PROGRESS_N}}
```

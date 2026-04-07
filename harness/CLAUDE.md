# CLAUDE.md — Multi-Agent Harness

**Planner → Generator → Evaluator** 구조로 역할을 분리해 단일 에이전트의 한계를 극복합니다.

---

## 핵심 원칙

- 단일 에이전트로 장시간 작업하지 않는다
- 각 에이전트는 자신의 역할에만 집중한다
- 자기 결과물을 스스로 최종 평가하지 않는다
- 기능 단위로 작업을 분리하고 단계마다 검증한다
- 스펙 없이 코드 작성 금지
- 실수 발생 시 반드시 `MISTAKE_LOG.md`에 기록

---

## 워크플로우

```
[요청] → [Planner: spec.md] → [Generator: 코드] → [Evaluator: 평가]
              ↑                       ↑                    │
           FAIL ←────────────────────┘            REVISE ──┘
```

---

## 에이전트 지침 파일

| 역할 | 파일 | 내용 |
|------|------|------|
| 🗂️ Planner | `AGENT_PLANNER.md` | 스펙 작성 지침 |
| ⚙️ Generator | `AGENT_GENERATOR.md` | 코드 작성 지침 |
| 🔍 Evaluator | `AGENT_EVALUATOR.md` | 평가 기준 및 피드백 형식 |
| 📋 실수 기록 | `MISTAKE_LOG.md` | 과거 실수 및 해결책 |

역할 시작 전 해당 파일을 반드시 먼저 읽는다.

---

## 컨텍스트 관리

- 세션 시작 시: `spec.md` → `progress.md` 순서로 확인
- 작업 상태는 항상 `progress.md`에 저장
- 에이전트 전환 시 이전 결과물 요약 전달

```
project/
├── CLAUDE.md           ← 핵심 원칙 (이 파일)
├── AGENT_PLANNER.md    ← Planner 전용 지침
├── AGENT_GENERATOR.md  ← Generator 전용 지침
├── AGENT_EVALUATOR.md  ← Evaluator 전용 지침
├── MISTAKE_LOG.md      ← 실수 기록
├── spec.md             ← Planner 산출물
├── progress.md         ← 현재 작업 상태
└── src/
```

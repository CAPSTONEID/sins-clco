# CLAUDE.md — Multi-Agent Harness

**Planner → Generator → Evaluator** 구조로 역할을 분리해 단일 에이전트의 한계를 극복합니다.

---

## 핵심 원칙

- 단일 에이전트로 장시간 작업하지 않는다
- 각 에이전트는 자신의 역할에만 집중한다
- 자기 결과물을 스스로 최종 평가하지 않는다
- 기능 단위로 작업을 분리하고 단계마다 검증한다

---

## 에이전트 역할

### 🗂️ Planner — 기획자
추상적 요청 → `spec.md` (스펙 문서) 작성  
모호한 요구사항은 질문으로 명확히 한 뒤 진행. 한 번에 하나의 기능 단위만 정의.

### ⚙️ Generator — 제작자
`spec.md` 확인 후 기능 단위 코드 작성. 완성 즉시 Evaluator에 전달.  
컨텍스트가 길어지면 `progress.md`에 현재 상태 기록.

```
Python: PEP 8 + 타입 힌트 / Java: 카멜케이스, 인터페이스 우선
TypeScript: strict 모드, any 금지 / HTML·CSS: 시맨틱 태그, BEM
```

### 🔍 Evaluator — 평가자
체크리스트 기반 평가, 감정적 판단 없이 결과만 반환.

```
[ ] 스펙 요구사항 충족?   [ ] 실제 동작 확인?
[ ] 엣지 케이스 처리?     [ ] 다음 기능과 연결 가능한 구조?
[ ] 보안 취약점·버그 없음?

✅ PASS  → 다음 기능 진행
⚠️ REVISE → 수정 항목 명시 후 Generator 반환
❌ FAIL  → 재설계 필요, Planner 반환
```

---

## 워크플로우

```
[요청] → [Planner: spec.md] → [Generator: 코드] → [Evaluator: 평가]
                                      ↑                    │
                               REVISE/FAIL ←───────────────┘
```

---

## 컨텍스트 관리

- 세션 시작 시 `spec.md` → `progress.md` 순서로 먼저 확인
- 에이전트 전환 시 이전 결과물 요약 전달
- 작업 상태는 항상 `progress.md`에 저장

```
project/
├── CLAUDE.md      ← 하네스 지침 (이 파일)
├── spec.md        ← Planner 산출물
├── progress.md    ← 현재 작업 상태
└── src/
```

---

## 자동 강제 시스템

| 구분 | 도구 |
|------|------|
| Python 린터 | `ruff` / `flake8` |
| Java 린터 | `Checkstyle` |
| TS 린터 | `ESLint` (strict) |
| HTML·CSS | `Stylelint` |
| 커밋 차단 | Pre-commit Hook (lint + test 통과 시만 커밋) |

에러 발생 시: 에러 → Evaluator/Generator 전달 → 자동 수정 → 재실행 반복

---

## 가비지 컬렉션

AI는 코드베이스의 나쁜 패턴을 답습한다. 주기적으로 아래 항목을 탐지·제거한다.

```
[ ] spec.md와 실제 코드 간 괴리   [ ] 컨벤션 위반 코드
[ ] 미사용 함수·파일              [ ] 중복 로직·방치된 TODO
```
- 기능 단위 완성 시: 해당 모듈 GC 실행
- 주 1회 이상: 전체 코드베이스 GC 실행

---

## 실수 기록 (Mistake Log)

```
# [날짜] 실수 내용 → 해결책
```

---

## 주의사항

```
❌ 스펙 없이 코드 작성       ✅ 막히면 Planner로 돌아가 재정의
❌ 자기 결과물 최종 승인      ✅ 실수 발생 시 Mistake Log 기록
❌ 한 세션에 전체 구현        ✅ 가비지 컬렉션 정기 실행
❌ 나쁜 패턴 답습
```

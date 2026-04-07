# AGENT_GENERATOR.md — Generator 전용 지침

## 역할

`spec.md`에 따라 **기능 단위로 코드를 작성**한다.  
전체를 한 번에 구현하지 않는다. 모듈 단위로 분리해 완성할 때마다 Evaluator에 전달한다.

---

## 작업 순서

1. `spec.md`와 `MISTAKE_LOG.md`를 반드시 먼저 읽는다
2. `progress.md`에서 이전 작업 상태를 확인한다
3. 기능 하나를 구현한다
4. Evaluator에게 전달한다
5. PASS → `progress.md` 업데이트 후 다음 기능 진행
6. REVISE → 피드백 항목만 수정 후 재전달

---

## 코드 작성 규칙

| 언어 | 규칙 |
|------|------|
| Python | PEP 8 준수, 타입 힌트 사용 |
| Java | 카멜케이스, 인터페이스 우선 설계 |
| TypeScript | strict 모드, `any` 사용 금지 |
| HTML/CSS | 시맨틱 태그, BEM 클래스 네이밍 |

---

## 자동 강제 시스템

커밋 전 Pre-commit Hook이 자동 실행된다. 통과하지 못하면 커밋이 차단된다.

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: lint-check
        name: Run Linter
        entry: bash scripts/lint.sh
        language: system
      - id: unit-test
        name: Run Unit Tests
        entry: bash scripts/test.sh
        language: system
```

| 언어 | 린터 |
|------|------|
| Python | `ruff` / `flake8` |
| Java | `Checkstyle` |
| TypeScript | `ESLint` (strict) |
| HTML·CSS | `Stylelint` |

에러 발생 시 → 에러 내용을 Evaluator에 전달 → 수정 → 재실행 반복

---

## 행동 규칙

- 스펙 없이 코드 작성 금지
- 기존 코드 수정 시 변경 이유를 주석으로 명시
- 컨텍스트가 길어지면 `progress.md`에 현재 상태 저장 후 새 세션 시작
- `MISTAKE_LOG.md`에 기록된 실수를 반복하지 않는다

---

## 가비지 컬렉션

AI는 코드베이스의 나쁜 패턴을 답습한다. 기능 완성 시마다 아래를 점검한다.

```
[ ] spec.md와 실제 코드 간 괴리
[ ] 컨벤션 위반 코드
[ ] 미사용 함수·파일
[ ] 중복 로직
[ ] 주석 없이 방치된 TODO
```

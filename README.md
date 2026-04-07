# SINS Claude — 스킬 & 하네스 패키지

SINS 프로젝트용 Claude Code 스킬 모음과 멀티 에이전트 하네스를 제공합니다.

---

📧 Mail : [project@capstone.id](mailto:project@capstone.id)

🤳 Instagram : [instagram.com/id.capstone](https://www.instagram.com/id.capstone)

🌐 Homepage : [capstone.id](https://www.capstone.id)

🧵 Threads : [threads.com/@id.capstone](https://www.threads.com/@id.capstone)

▶️ YouTube : [youtube.com/@실무자](https://www.youtube.com/@실무자)

---

## 목차

1. [스킬 설치](#-스킬-설치)
2. [하네스 (sins-harness)](#-하네스-sins-harness)
3. [스킬 + 하네스 함께 사용하는 방법](#-스킬--하네스-함께-사용하는-방법)

---

## 📦 스킬 설치

### 포함된 스킬

| 파일 | 명령어 | 설명 |
|------|--------|------|
| `sins-harness-code.skill` | `/sins-harness-code` | 멀티 에이전트 하네스 파일 일괄 생성 |
| `sins-card-news-creator.skill` | `/sins-card-news-creator` | 인스타그램 카드뉴스 자동 제작 |
| `sins-imgvideo-prompt.skill` | `/sins-imgvideo-prompt` | AI 이미지·영상 프롬프트 생성 |
| `sins-marketing-team.skill` | `/sins-marketing-team` | 마케팅 전략 팀 구성 및 실행 |
| `sins-research-team.skill` | `/sins-research-team` | 리서치·분석 팀 구성 및 실행 |
| `sins-web-pt.skill` | `/sins-web-pt` | 스크립트 기반 웹 발표자료 제작 |

### 방법 1 — 한 줄 설치 (권장)

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-claude/main/sins-skill-all-install.sh | bash
```

### 방법 2 — 수동 설치

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/CAPSTONEID/sins-claude.git /tmp/sins-claude
cp /tmp/sins-claude/*.skill ~/.claude/skills/
rm -rf /tmp/sins-claude
echo "✅ 설치 완료"
```

### 방법 3 — 개별 스킬 설치

원하는 스킬만 골라서 설치하세요. 모든 스킬은 아래 준비 명령어를 먼저 실행해야 합니다.

**준비 (공통)**
```bash
mkdir -p ~/.claude/skills
```

---

**① sins-harness-code** — 멀티 에이전트 하네스 파일 일괄 생성
```bash
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/skill-list/sins-harness-code.skill \
  -o ~/.claude/skills/sins-harness-code.skill
```

---

**② sins-card-news-creator** — 인스타그램 카드뉴스 자동 제작
```bash
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/skill-list/sins-card-news-creator.skill \
  -o ~/.claude/skills/sins-card-news-creator.skill
```

---

**③ sins-imgvideo-prompt** — AI 이미지·영상 프롬프트 생성
```bash
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/skill-list/sins-imgvideo-prompt.skill \
  -o ~/.claude/skills/sins-imgvideo-prompt.skill
```

---

**④ sins-marketing-team** — 마케팅 전략 팀 구성 및 실행
```bash
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/skill-list/sins-marketing-team.skill \
  -o ~/.claude/skills/sins-marketing-team.skill
```

---

**⑤ sins-research-team** — 리서치·분석 팀 구성 및 실행
```bash
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/skill-list/sins-research-team.skill \
  -o ~/.claude/skills/sins-research-team.skill
```

---

**⑥ sins-web-pt** — 스크립트 기반 웹 발표자료 제작
```bash
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/skill-list/sins-web-pt.skill \
  -o ~/.claude/skills/sins-web-pt.skill
```

### 설치 확인

```bash
ls ~/.claude/skills/
```

Claude Code를 재시작하면 `/sins-*` 명령어로 스킬을 사용할 수 있습니다.

---

## 🧠 하네스 (sins-harness)

### 하네스란?

단일 Claude 세션의 두 가지 한계를 극복하는 구조입니다.

- **컨텍스트 소실** — 대화가 길어지면 앞 내용을 잊음
- **자기 평가 편향** — 자신이 만든 결과물을 스스로 검증하면 오류를 놓침

이를 해결하기 위해 역할을 **Planner → Generator → Evaluator** 3단계로 분리하고,
각 역할의 지침을 별도 파일로 관리합니다.

```
[요청] → [Planner: spec.md] → [Generator: 코드] → [Evaluator: 평가]
              ↑                       ↑                    │
           FAIL ←────────────────────┘            REVISE ──┘
```

### 어디에 사용하면 좋은가?

| 상황 | 적합 여부 | 이유 |
|------|-----------|------|
| 코드 개발 프로젝트 | ✅ 최적 | 스펙 → 구현 → 검증 흐름이 그대로 맞음 |
| 장기 진행 작업 | ✅ 최적 | 컨텍스트가 초기화돼도 파일로 복구 |
| 팀 전체 Claude 운영 기준 통일 | ✅ 최적 | 역할 정의가 세션 간 일관성 보장 |
| 단발성 간단한 질문 | ❌ 과함 | 그냥 물어보는 게 더 빠름 |
| 스킬 단독 실행 | ⚠️ 선택적 | 스킬 자체에 이미 역할이 내장됨 |

### 어떻게 사용하는가?

**Step 1 — sins-harness 스킬 설치 (위 설치 방법 참고)**

**Step 2 — 프로젝트 폴더에서 Claude Code 실행 후 스킬 호출**

```
/sins-harness
```

실행하면 현재 프로젝트에 아래 5개 파일이 자동 생성됩니다.

```
project/
├── harness/
│   └── coding-use/
│       ├── CLAUDE.md           ← 핵심 원칙 (세션마다 자동 로드)
│       ├── AGENT_PLANNER.md    ← Planner 전용 지침
│       ├── AGENT_GENERATOR.md  ← Generator 전용 지침
│       ├── AGENT_EVALUATOR.md  ← Evaluator 전용 지침
│       └── MISTAKE_LOG.md      ← 실수 기록 (계속 누적)
```

**Step 3 — 역할을 지정해서 작업 시작**

```
# 기능 기획
"Planner 역할로 [기능명] spec.md 작성해줘"

# 구현
"Generator 역할로 spec.md 보고 구현해줘"

# 검토
"Evaluator 역할로 체크리스트 평가해줘"
```

### 각 파일의 역할

| 파일 | 자동 로드 | 역할 |
|------|-----------|------|
| `CLAUDE.md` | ✅ 세션마다 자동 | 핵심 원칙 + 워크플로우 요약 |
| `AGENT_PLANNER.md` | 수동 참조 | spec.md 작성 지침 |
| `AGENT_GENERATOR.md` | 수동 참조 | 코드 작성·린터·가비지컬렉션 지침 |
| `AGENT_EVALUATOR.md` | 수동 참조 | 체크리스트·PASS/REVISE/FAIL 기준 |
| `MISTAKE_LOG.md` | 수동 참조 | 과거 실수 기록, 재발 방지 필터 |

> `CLAUDE.md`만 매 세션 자동으로 읽히므로 짧게 유지합니다.
> 나머지 파일은 해당 역할이 필요할 때만 로드해 컨텍스트를 아낍니다.

### 핵심 규칙

| 금지 | 권장 |
|------|------|
| 스펙 없이 코드 작성 | 반드시 spec.md 먼저 |
| 자기 결과물 최종 승인 | Evaluator가 평가 |
| 한 세션에 전체 구현 | 기능 단위로 분리 |
| 나쁜 코드 패턴 답습 | 가비지 컬렉션 정기 실행 |

---

## 🔗 스킬 + 하네스 함께 사용하는 방법

스킬과 하네스는 **서로 다른 레이어**에서 동작하며 함께 사용할 수 있습니다.

| 구분 | 스킬 (`.skill`) | 하네스 (`CLAUDE.md` 등) |
|------|----------------|------------------------|
| 역할 | 특정 작업 자동화 | 전체 프로젝트 운영 구조 |
| 적용 시점 | 명령어 실행 시 | 모든 세션에 항상 적용 |
| 설치 위치 | `~/.claude/skills/` | 프로젝트 루트 |

**추천 흐름:**

```
1. /sins-harness 실행 → 프로젝트에 하네스 파일 생성
2. Planner 역할로 기능 스펙 작성 (spec.md)
3. 필요한 스킬 실행 (/sins-research-team, /sins-web-pt 등)
4. Generator 역할로 스킬 결과물 활용해 구현
5. Evaluator 역할로 최종 검토
```

---

## 요구사항

- [Claude Code](https://claude.ai/code) CLI 또는 데스크톱 앱 설치 필요
- macOS / Linux 지원

# SINS Claude & codex — 스킬 & 하네스 패키지

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
2. [Hermes Agent 설치 및 SINS 스킬 적용](#-hermes-agent-설치-및-sins-스킬-적용)
3. [하네스 (sins-harness)](#-하네스-sins-harness)
4. [스킬 + 하네스 함께 사용하는 방법](#-스킬--하네스-함께-사용하는-방법)

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
| `sins-web-pt.skill` | `/sins-web-pt` | 스크립트 기반 웹 발표자료 제작 (make-slide `neon-terminal` 자동 준비) |
| `sins-muti-creator.skill` | `/sins-muti-creator` | 유튜브 스크립트·발표 대본·카드뉴스 통합 제작 (6개 페이지 자동 저장) |
| `sins-press-release.skill` | `/sins-press-release` | 보도자료 작성 자동화 |
| `sins-item-search.skill` | `/sins-item-search` | 아이템·상품 리서치 및 분석 |
| `sins-cardvideo.skill` | `/sins-cardvideo` | JSON 기반 1080×1920 카드뉴스 영상 + 폴더 기반 16:9 HyperFrames 순차 카드 영상 제작 |

> 참고: `/sins-web-pt`는 make-slide의 `neon-terminal` 테마 표현을 사용합니다. 스킬 실행 시 현재 작업 디렉터리의 `.claude/skills/make-slide/`를 확인하고, 없거나 `neon-terminal` 테마가 없으면 `npx -y make-slide@latest init`을 자동 실행하도록 스킬에 포함되어 있습니다. 따라서 `/sins-web-pt`를 쓰려면 Node.js/npm의 `npx`가 필요합니다.

---

### 방법 1 — 한 줄 설치 (권장)

#### Claude Code

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- claude
```

#### Codex

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- codex
```

#### Hermes Agent

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- hermes
```

---

### 방법 2 — 수동 설치

#### Claude Code

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh claude
rm -rf /tmp/sins-clco
echo "✅ Claude Code 설치 완료"
```

#### Codex

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh codex
rm -rf /tmp/sins-clco
echo "✅ Codex 설치 완료"
```

#### Hermes Agent

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh hermes
rm -rf /tmp/sins-clco
echo "✅ Hermes Agent 설치 완료"
```

---

### 방법 3 — 개별 스킬 설치

원하는 스킬만 골라서 설치하세요. 모든 스킬은 아래 준비 명령어를 먼저 실행해야 합니다.

#### Claude Code 준비

```bash
mkdir -p ~/.claude/skills
```

#### Codex 준비

```bash
mkdir -p ~/.codex/skills
```

#### Hermes 준비

```bash
mkdir -p ~/.hermes/skills/sins
```

---

**① sins-harness-code** — 멀티 에이전트 하네스 파일 일괄 생성

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-harness-code.skill \
  -o ~/.claude/skills/sins-harness-code.skill
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-harness-code.skill \
  -o ~/.codex/skills/sins-harness-code.skill
```

---

**② sins-card-news-creator** — 인스타그램 카드뉴스 자동 제작

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-card-news-creator.skill \
  -o ~/.claude/skills/sins-card-news-creator.skill
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-card-news-creator.skill \
  -o ~/.codex/skills/sins-card-news-creator.skill
```

---

**③ sins-imgvideo-prompt** — AI 이미지·영상 프롬프트 생성

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-imgvideo-prompt.skill \
  -o ~/.claude/skills/sins-imgvideo-prompt.skill
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-imgvideo-prompt.skill \
  -o ~/.codex/skills/sins-imgvideo-prompt.skill
```

---

**④ sins-marketing-team** — 마케팅 전략 팀 구성 및 실행

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-marketing-team.skill \
  -o ~/.claude/skills/sins-marketing-team.skill
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-marketing-team.skill \
  -o ~/.codex/skills/sins-marketing-team.skill
```

---

**⑤ sins-research-team** — 리서치·분석 팀 구성 및 실행

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-research-team.skill \
  -o ~/.claude/skills/sins-research-team.skill
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-research-team.skill \
  -o ~/.codex/skills/sins-research-team.skill
```

---

**⑥ sins-web-pt** — 스크립트 기반 웹 발표자료 제작

`sins-web-pt`는 make-slide `neon-terminal` 테마를 기준으로 사용합니다. 스킬 내부에 make-slide 준비 preflight가 포함되어 있어, 현재 작업 디렉터리에 `.claude/skills/make-slide/SKILL.md` 또는 `references/themes.md`의 `neon-terminal` 항목이 없으면 `npx -y make-slide@latest init`을 자동 실행합니다. `npx`가 없는 환경에서는 먼저 Node.js/npm을 설치해야 합니다.

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-web-pt.skill \
  -o ~/.claude/skills/sins-web-pt.skill
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-web-pt.skill \
  -o ~/.codex/skills/sins-web-pt.skill
```

---

**⑦ sins-muti-creator** — 유튜브 스크립트·발표 대본·카드뉴스 통합 제작

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-muti-creator.skill \
  -o ~/.claude/skills/sins-muti-creator.skill
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-muti-creator.skill \
  -o ~/.codex/skills/sins-muti-creator.skill
```

---

**⑧ sins-press-release** — 보도자료 작성 자동화

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-press-release.skill \
  -o ~/.claude/skills/sins-press-release.skill
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-press-release.skill \
  -o ~/.codex/skills/sins-press-release.skill
```

---

**⑨ sins-item-search** — 아이템·상품 리서치 및 분석

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-item-search.skill \
  -o ~/.claude/skills/sins-item-search.skill
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-item-search.skill \
  -o ~/.codex/skills/sins-item-search.skill
```

---

**⑩ sins-cardvideo** — JSON 기반 1080×1920 카드뉴스 영상 + 폴더 기반 16:9 HyperFrames 순차 카드 영상 제작

Claude Code:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-cardvideo.skill \
  -o /tmp/sins-cardvideo.skill
mkdir -p ~/.claude/skills/sins-cardvideo
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-cardvideo.skill').extractall(os.path.expanduser('~/.claude/skills/sins-cardvideo'))
PY
```

Codex:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-cardvideo.skill \
  -o /tmp/sins-cardvideo.skill
mkdir -p ~/.codex/skills/sins-cardvideo
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-cardvideo.skill').extractall(os.path.expanduser('~/.codex/skills/sins-cardvideo'))
PY
```

Hermes Agent:
```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-cardvideo.skill \
  -o /tmp/sins-cardvideo.skill
mkdir -p ~/.hermes/skills/sins/sins-cardvideo
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-cardvideo.skill').extractall(os.path.expanduser('~/.hermes/skills/sins/sins-cardvideo'))
PY
```

---

### 설치 확인

#### Claude Code

```bash
ls ~/.claude/skills/
```

Claude Code를 재시작하면 `/sins-*` 명령어로 스킬을 사용할 수 있습니다.

#### Codex

```bash
ls ~/.codex/skills/
```

Codex에서는 `@` 파일 참조로 스킬을 불러옵니다.

```
@~/.codex/skills/sins-marketing-team/SKILL.md 위 내용대로 실행해줘
```

#### Hermes Agent

```bash
ls ~/.hermes/skills/sins/
hermes skills list | grep sins || true
```

Hermes에서는 아래처럼 사용할 수 있습니다.

```bash
hermes -s sins-web-pt
hermes -s sins-cardvideo
# 또는 대화 중: /skill sins-web-pt / /skill sins-cardvideo
```

---

## 🤖 Hermes Agent 설치 및 SINS 스킬 적용

Hermes Agent는 터미널·메신저·IDE에서 동작하는 오픈소스 AI 에이전트입니다. SINS 스킬은 Hermes의 스킬 디렉터리에 설치해 재사용할 수 있습니다.

### 1) Hermes Agent 설치

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

설치 후 초기 설정을 진행합니다.

```bash
hermes setup
hermes doctor
```

### 2) SINS 스킬 설치

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- hermes
```

설치 위치는 기본적으로 아래와 같습니다.

```bash
~/.hermes/skills/sins/sins-web-pt/SKILL.md
~/.hermes/skills/sins/sins-cardvideo/SKILL.md
```

### 3) 실행 예시

```bash
hermes -s sins-web-pt
hermes -s sins-cardvideo
```

대화 중에는 다음처럼 스킬을 불러올 수 있습니다.

```
/skill sins-web-pt
스크립트로 발표용 웹 프레젠테이션 만들어줘

/skill sins-cardvideo
JSON과 결과물 폴더로 카드뉴스 영상 만들어줘

/skill sins-cardvideo
하이퍼프레임으로 이 폴더의 01.mp4와 Card PNG들을 카드 순서대로 16:9 영상으로 만들어줘
```

### 4) 업데이트

```bash
cd ~/.hermes/hermes-agent 2>/dev/null || true
hermes update
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- hermes
```

---

## 🧠 하네스 (sins-harness)

### 하네스란?

단일 AI 세션의 두 가지 한계를 극복하는 구조입니다.

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
| 팀 전체 AI 운영 기준 통일 | ✅ 최적 | 역할 정의가 세션 간 일관성 보장 |
| 단발성 간단한 질문 | ❌ 과함 | 그냥 물어보는 게 더 빠름 |
| 스킬 단독 실행 | ⚠️ 선택적 | 스킬 자체에 이미 역할이 내장됨 |

### 어떻게 사용하는가?

#### Claude Code

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

#### Codex

**Step 1 — 하네스 파일 다운로드**

```bash
mkdir -p ~/.codex/harness
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/harness/coding-use/CLAUDE.md \
  -o ~/.codex/harness/AGENT_CORE.md
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/harness/coding-use/AGENT_GENERATOR.md \
  -o ~/.codex/harness/AGENT_GENERATOR.md
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/harness/coding-use/AGENT_EVALUATOR.md \
  -o ~/.codex/harness/AGENT_EVALUATOR.md
```

**Step 2 — 프로젝트에 AGENTS.md 생성**

```bash
cp ~/.codex/harness/AGENT_CORE.md ./AGENTS.md
```

**Step 3 — Codex에서 역할 지정**

```
@~/.codex/harness/AGENT_GENERATOR.md spec.md 보고 구현해줘
@~/.codex/harness/AGENT_EVALUATOR.md 체크리스트 평가해줘
```

### 각 파일의 역할

| 파일 | Claude Code 자동 로드 | Codex 로드 방식 | 역할 |
|------|-----------------------|-----------------|------|
| `CLAUDE.md` / `AGENTS.md` | ✅ 세션마다 자동 | ✅ 세션마다 자동 | 핵심 원칙 + 워크플로우 요약 |
| `AGENT_PLANNER.md` | 수동 참조 | `@파일경로` 참조 | spec.md 작성 지침 |
| `AGENT_GENERATOR.md` | 수동 참조 | `@파일경로` 참조 | 코드 작성·린터·가비지컬렉션 지침 |
| `AGENT_EVALUATOR.md` | 수동 참조 | `@파일경로` 참조 | 체크리스트·PASS/REVISE/FAIL 기준 |
| `MISTAKE_LOG.md` | 수동 참조 | `@파일경로` 참조 | 과거 실수 기록, 재발 방지 필터 |

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

| 구분 | 스킬 (`.skill`) | 하네스 (`CLAUDE.md` / `AGENTS.md`) |
|------|----------------|-------------------------------------|
| 역할 | 특정 작업 자동화 | 전체 프로젝트 운영 구조 |
| 적용 시점 | 명령어 실행 시 | 모든 세션에 항상 적용 |
| Claude Code 위치 | `~/.claude/skills/` | 프로젝트 루트 |
| Codex 위치 | `~/.codex/skills/` | 프로젝트 루트 (`AGENTS.md`) |

### Claude Code 추천 흐름

```
1. /sins-harness 실행 → 프로젝트에 하네스 파일 생성
2. Planner 역할로 기능 스펙 작성 (spec.md)
3. 필요한 스킬 실행 (/sins-research-team, /sins-web-pt 등)
4. Generator 역할로 스킬 결과물 활용해 구현
5. Evaluator 역할로 최종 검토
```

### Codex 추천 흐름

```
1. cp ~/.codex/harness/AGENT_CORE.md ./AGENTS.md → 하네스 적용
2. Planner: @~/.codex/harness/AGENT_PLANNER.md spec.md 작성해줘
3. 스킬 실행: @~/.codex/skills/sins-research-team.skill 실행해줘
4. Generator: @~/.codex/harness/AGENT_GENERATOR.md spec.md 보고 구현해줘
5. Evaluator: @~/.codex/harness/AGENT_EVALUATOR.md 체크리스트 평가해줘
```

---

## 요구사항

| 도구 | 설치 링크 | 지원 OS |
|------|-----------|---------|
| Claude Code | [claude.ai/code](https://claude.ai/code) | macOS / Linux |
| Codex CLI | [openai.com/codex](https://openai.com/codex) | macOS / Linux |
| Hermes Agent | [hermes-agent.nousresearch.com/docs](https://hermes-agent.nousresearch.com/docs) | macOS / Linux / WSL |

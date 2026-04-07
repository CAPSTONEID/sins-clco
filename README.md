# SINS Claude — 스킬 & 하네스 패키지

SINS 프로젝트용 Claude Code 스킬 모음과 멀티 에이전트 하네스(CLAUDE.md)를 제공합니다.

---

## 목차

1. [스킬 설치](#-스킬-설치)
2. [하네스 (CLAUDE.md)](#-하네스-claudemd)
3. [함께 사용하는 방법](#-스킬--하네스-함께-사용하는-방법)

---

## 📦 스킬 설치

### 포함된 스킬

| 파일 | 스킬 이름 | 설명 |
|------|-----------|------|
| `sins-card-news-creator.skill` | 카드뉴스 제작 | 인스타그램 카드뉴스 자동 제작 |
| `sins-imgvideo-prompt.skill` | 이미지/영상 프롬프트 | AI 이미지·영상 서비스용 프롬프트 생성 |
| `sins-marketing-team.skill` | 마케팅 팀 | 마케팅 전략 팀 구성 및 실행 |
| `sins-research-team.skill` | 리서치 팀 | 리서치·분석 팀 구성 및 실행 |
| `sins-web-pt.skill` | 웹 프레젠테이션 | 스크립트 기반 웹 발표자료 제작 |

### 방법 1 — 한 줄 설치 (권장)

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-claude/main/install.sh | bash
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

```bash
mkdir -p ~/.claude/skills

# 카드뉴스 제작
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-card-news-creator.skill \
  -o ~/.claude/skills/sins-card-news-creator.skill

# 이미지/영상 프롬프트
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-imgvideo-prompt.skill \
  -o ~/.claude/skills/sins-imgvideo-prompt.skill

# 마케팅 팀
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-marketing-team.skill \
  -o ~/.claude/skills/sins-marketing-team.skill

# 리서치 팀
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-research-team.skill \
  -o ~/.claude/skills/sins-research-team.skill

# 웹 프레젠테이션
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-web-pt.skill \
  -o ~/.claude/skills/sins-web-pt.skill
```

### 설치 확인

```bash
ls ~/.claude/skills/
```

Claude Code를 재시작하면 `/sins-*` 명령어로 스킬을 불러올 수 있습니다.

---

## 🧠 하네스 (CLAUDE.md)

### 하네스란?

`CLAUDE.md`는 단순한 설정 파일이 아니라 **멀티 에이전트 운영 지침서**입니다.

Claude는 새 세션을 시작할 때 프로젝트 루트의 `CLAUDE.md`를 자동으로 읽습니다.  
이 파일에 역할과 규칙을 정의해두면, **컨텍스트가 초기화되어도 일관된 행동**을 유지시킬 수 있습니다.

이 하네스는 **Planner → Generator → Evaluator** 3단계 구조로 에이전트 역할을 분리합니다.

```
[요청 입력]
    ↓
[Planner]   → 스펙 문서(spec.md) 작성
    ↓
[Generator] → 기능 단위 코드 작성
    ↓
[Evaluator] → 체크리스트 기반 평가
    ↓
  ✅ PASS → 다음 기능
  ⚠️ REVISE → Generator로 반환
  ❌ FAIL  → Planner로 반환
```

### 어디에 사용하면 좋은가?

| 상황 | 적합 여부 | 이유 |
|------|-----------|------|
| 코드 개발 프로젝트 | ✅ 최적 | 스펙 → 구현 → 검증 흐름이 그대로 맞음 |
| 장기 진행 작업 | ✅ 최적 | 컨텍스트가 날아가도 `progress.md`로 복구 |
| 여러 에이전트 세션을 이어가는 작업 | ✅ 최적 | 역할 정의가 세션 간 일관성 보장 |
| 단발성 간단한 질문 | ❌ 과함 | 구조 없이 그냥 물어보는 게 더 빠름 |
| 스킬 실행 세션 | ⚠️ 선택적 | 스킬 자체에 이미 역할이 내장되어 있음 |

**핵심 사용 시나리오:**
- 웹/앱 개발처럼 기능이 여러 개로 나뉘는 프로젝트
- 혼자 Claude와 장기간 협업하면서 AI 실수를 줄이고 싶을 때
- 팀 전체가 동일한 Claude 행동 기준을 공유해야 할 때

### 어떻게 사용하는가?

**Step 1 — 프로젝트 루트에 복사**

```bash
# 원하는 프로젝트 폴더로 이동
cd ~/my-project

# CLAUDE.md 다운로드
curl -L https://raw.githubusercontent.com/CAPSTONEID/sins-claude/main/CLAUDE.md \
  -o CLAUDE.md

echo "✅ 하네스 설치 완료"
```

**Step 2 — Claude Code 시작**

```bash
claude
```

Claude가 세션 시작 시 `CLAUDE.md`를 자동으로 읽고 하네스 구조를 인지합니다.

**Step 3 — Planner 모드로 작업 시작**

새 기능을 시작할 때는 반드시 Planner에게 먼저 스펙을 요청합니다:

```
지금부터 Planner 역할로, [기능 이름]에 대한 spec.md를 작성해줘.
```

**Step 4 — Generator에게 구현 위임**

```
spec.md를 확인하고 Generator 역할로 [기능 이름]을 구현해줘.
```

**Step 5 — Evaluator에게 검토 요청**

```
방금 작성한 코드를 Evaluator 역할로 체크리스트 기반으로 평가해줘.
```

### 하네스가 관리하는 파일들

```
project/
├── CLAUDE.md       ← 하네스 지침 (이 파일)
├── spec.md         ← Planner가 작성하는 기능 스펙
├── progress.md     ← 현재 작업 상태 (세션 간 인수인계)
├── src/
│   ├── backend/
│   └── frontend/
└── evaluation/
    └── reports/    ← Evaluator 피드백 기록
```

### 핵심 규칙 요약

| 금지 | 권장 |
|------|------|
| 스펙 없이 코드 작성 | 반드시 spec.md 먼저 |
| 자기 결과물 스스로 최종 승인 | Evaluator가 평가 |
| 한 세션에 모든 기능 구현 | 기능 단위로 분리 |
| 나쁜 코드 패턴 답습 | 주기적 가비지 컬렉션 실행 |

---

## 🔗 스킬 + 하네스 함께 사용하는 방법

스킬과 하네스는 **서로 다른 레이어**에서 동작하며 함께 사용할 수 있습니다.

| 구분 | 스킬 (`.skill`) | 하네스 (`CLAUDE.md`) |
|------|----------------|----------------------|
| 역할 | 특정 작업 자동화 | 전체 프로젝트 운영 구조 정의 |
| 적용 범위 | 명령어 실행 시 | 모든 세션에 항상 적용 |
| 예시 | `/sins-web-pt` 실행 | "스펙 먼저, 평가는 Evaluator가" |

**추천 흐름:**

```
1. 프로젝트 루트에 CLAUDE.md 설치 (하네스 활성화)
2. Planner로 기능 스펙 작성
3. 필요한 스킬 실행 (/sins-research-team, /sins-web-pt 등)
4. Generator가 스킬 결과물을 활용해 구현
5. Evaluator가 최종 검토
```

---

## 요구사항

- [Claude Code](https://claude.ai/code) CLI 설치 필요
- macOS / Linux 지원

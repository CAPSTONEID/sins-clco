# SINS Claude & Codex & Hermes 스킬 패키지

SINS 프로젝트용 Claude Code, Codex, Hermes 스킬 패키지입니다.

---

📧 Mail : [project@capstone.id](mailto:project@capstone.id)

🤳 Instagram : [instagram.com/id.capstone](https://www.instagram.com/id.capstone)

🌐 Homepage : [capstone.id](https://www.capstone.id)

🧵 Threads : [threads.com/@id.capstone](https://www.threads.com/@id.capstone)

▶️ YouTube : [youtube.com/@실무자](https://www.youtube.com/@실무자)

---

## 포함된 스킬

| 파일 | 명령어 | 설명 |
|------|--------|------|
| `sins-card-news-creator.skill` | `/sins-card-news-creator` | 인스타그램 카드뉴스 HTML, 캡션 TXT, 이미지 프롬프트 TXT 제작 |
| `sins-marketing-team.skill` | `/sins-marketing-team` | 마케팅 전략 팀 구성 및 실행 |
| `sins-sidenote-pass.skill` | `/sins-sidenote-pass` | SideNotes 고정 폴더에 새 메모 저장 및 기본 접기 처리 |
| `sins-web-pt.skill` | `/sins-web-pt` | 스크립트/PPTX 기반 웹 발표자료 HTML 및 발표 대본 TXT 제작 |
| `sins-wiki-pass.skill` | `/sins-wiki-pass` | Obsidian "LLM Wiki" 볼트와 Notion 위키 DB 동시 저장·동기화 (수동 발동, 기본 5종 자동분류 + `--dir`로 신규 카테고리 동적 생성) |
| `sins-llmwiki-auto.skill` | `/sins-llmwiki-auto` | 질문·답변·업무·제작 내용을 **자동으로** LLM 위키에 정리·기록하는 상시 발동 정책 (sins-wiki-pass 연동) |
| `sins-loopass-setup.skill` | `/sins-loopass-setup` | 루프 엔지니어링(자율 AI 에이전트 루프)을 6단계 인터뷰로 설계·세팅하는 위저드 (트리거→행동→검증→정지조건→아키텍처→산출, 단계별 스킬·MCP 추천 + 실행 가능한 루프 스킬 자동 생성) |

## 함께 설치되는 외부 오픈소스 스킬

한 줄 설치와 수동 설치는 SINS 스킬 설치 후 아래 외부 스킬도 같이 설치합니다. (Hermes 대상은 gstack·superpowers·caveman 등을 자체 번들로 이미 제공하므로 외부 스킬 설치를 건너뛰고 SINS 스킬만 설치합니다.)

| 이름 | 대상 | 출처 |
|------|------|------|
| Caveman | Claude 전용 | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) |
| Frontend Slides | Claude 전용 | [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) |
| Grill Me | Claude 전용 | [mattpocock/skills](https://github.com/mattpocock/skills) |
| Handoff | Claude 전용 | [mattpocock/skills](https://github.com/mattpocock/skills) |
| Harness | Claude 전용 | [revfactory/harness](https://github.com/revfactory/harness) |
| UI/UX Pro Max | Claude 전용 | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) |
| HyperFrames | Claude / Codex | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) |
| gstack | Claude / Codex | [garrytan/gstack](https://github.com/garrytan/gstack) |
| Superpowers | Claude / Codex | [obra/superpowers](https://github.com/obra/superpowers) |
| Humanize Korean | Claude / Codex | [epoko77-ai/im-not-ai](https://github.com/epoko77-ai/im-not-ai) |
| Insane Search | Codex 전용 | [sinmb79/codex-insane-search](https://github.com/sinmb79/codex-insane-search) |
| Insane Search | Claude 전용 | [fivetaku/insane-search](https://github.com/fivetaku/insane-search) |
| oh-my-design | Claude / Codex | [kwakseongjae/oh-my-design](https://github.com/kwakseongjae/oh-my-design) |

> **oh-my-design 채널 차이** — 286개 실제 기업 디자인 레퍼런스 기반 디자인 시스템 스킬 17개 + 서브에이전트 16개. 자체 `oh-my-design-cli` npx 설치를 사용하며 Claude·Codex 채널을 따로 설치합니다. Claude는 `--agent claude-code`로 스킬 `~/.claude/skills`, 에이전트 `~/.claude/agents`, 데이터 `~/.claude/data`에 설치하고, Codex는 `--agent codex`로 스킬 `~/.agents/skills`, 에이전트 `~/.codex/agents`, 데이터 `~/.codex/data`에 설치합니다(각 도구의 정규 경로). `npx`(Node.js)가 필요하며 없으면 자동으로 건너뜁니다. 건너뛰려면 `SINS_SKIP_OMD=1`. Hermes는 대상에서 제외됩니다.

> **Humanize Korean 모드 차이** — Claude는 Fast(단일 호출) + strict 5인 파이프라인을 모두 설치합니다(스킬 `humanize-korean`·`humanize`·`humanize-redo` 3개 + `~/.claude/agents/` 서브에이전트 12개). Codex는 다중 서브에이전트를 결정적으로 실행하지 못해 Fast(단일 호출) 모드만 설치합니다(`humanize-korean` 1개). Hermes는 대상에서 제외됩니다.

외부 스킬 설치를 건너뛰려면 다음처럼 실행합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | SINS_SKIP_EXTERNAL=1 bash -s -- claude
```

`oh-my-design`만 건너뛰려면 `SINS_SKIP_OMD=1` 을 사용합니다(나머지 외부 스킬은 그대로 설치).

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | SINS_SKIP_OMD=1 bash -s -- claude
```

`gstack`은 기본적으로 스킬 파일만 복사합니다. 브라우저 빌드와 Playwright 설치까지 포함한 gstack 자체 setup을 함께 실행하려면 다음처럼 명시합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | SINS_RUN_GSTACK_SETUP=1 bash -s -- claude
```

## 한 줄 설치

### Claude Code

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- claude
```

### Codex

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- codex
```

### Hermes

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- hermes
```

## 수동 설치

### Claude Code

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh claude
rm -rf /tmp/sins-clco
echo "Claude Code 설치 완료"
```

### Codex

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh codex
rm -rf /tmp/sins-clco
echo "Codex 설치 완료"
```

### Hermes

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh hermes
rm -rf /tmp/sins-clco
echo "Hermes 설치 완료"
```

## 개별 스킬 설치

### Claude Code 준비

```bash
mkdir -p ~/.claude/skills
```

### Codex 준비

```bash
mkdir -p ~/.codex/skills
```

### Hermes 준비

```bash
mkdir -p ~/.hermes/skills
```

### sins-card-news-creator

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-card-news-creator.skill \
  -o /tmp/sins-card-news-creator.skill
mkdir -p ~/.claude/skills/sins-card-news-creator
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-card-news-creator.skill').extractall(os.path.expanduser('~/.claude/skills/sins-card-news-creator'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-card-news-creator.skill \
  -o /tmp/sins-card-news-creator.skill
mkdir -p ~/.codex/skills/sins-card-news-creator
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-card-news-creator.skill').extractall(os.path.expanduser('~/.codex/skills/sins-card-news-creator'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-card-news-creator.skill \
  -o /tmp/sins-card-news-creator.skill
mkdir -p ~/.hermes/skills/sins-card-news-creator
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-card-news-creator.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-card-news-creator'))
PY
```

### sins-marketing-team

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-marketing-team.skill \
  -o /tmp/sins-marketing-team.skill
mkdir -p ~/.claude/skills/sins-marketing-team
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-marketing-team.skill').extractall(os.path.expanduser('~/.claude/skills/sins-marketing-team'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-marketing-team.skill \
  -o /tmp/sins-marketing-team.skill
mkdir -p ~/.codex/skills/sins-marketing-team
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-marketing-team.skill').extractall(os.path.expanduser('~/.codex/skills/sins-marketing-team'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-marketing-team.skill \
  -o /tmp/sins-marketing-team.skill
mkdir -p ~/.hermes/skills/sins-marketing-team
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-marketing-team.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-marketing-team'))
PY
```

### sins-sidenote-pass

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-sidenote-pass.skill \
  -o /tmp/sins-sidenote-pass.skill
mkdir -p ~/.claude/skills/sins-sidenote-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-sidenote-pass.skill').extractall(os.path.expanduser('~/.claude/skills/sins-sidenote-pass'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-sidenote-pass.skill \
  -o /tmp/sins-sidenote-pass.skill
mkdir -p ~/.codex/skills/sins-sidenote-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-sidenote-pass.skill').extractall(os.path.expanduser('~/.codex/skills/sins-sidenote-pass'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-sidenote-pass.skill \
  -o /tmp/sins-sidenote-pass.skill
mkdir -p ~/.hermes/skills/sins-sidenote-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-sidenote-pass.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-sidenote-pass'))
PY
```

### sins-web-pt

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-web-pt.skill \
  -o /tmp/sins-web-pt.skill
mkdir -p ~/.claude/skills/sins-web-pt
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-web-pt.skill').extractall(os.path.expanduser('~/.claude/skills/sins-web-pt'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-web-pt.skill \
  -o /tmp/sins-web-pt.skill
mkdir -p ~/.codex/skills/sins-web-pt
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-web-pt.skill').extractall(os.path.expanduser('~/.codex/skills/sins-web-pt'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-web-pt.skill \
  -o /tmp/sins-web-pt.skill
mkdir -p ~/.hermes/skills/sins-web-pt
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-web-pt.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-web-pt'))
PY
```

### sins-wiki-pass

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-wiki-pass.skill \
  -o /tmp/sins-wiki-pass.skill
mkdir -p ~/.claude/skills/sins-wiki-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-wiki-pass.skill').extractall(os.path.expanduser('~/.claude/skills/sins-wiki-pass'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-wiki-pass.skill \
  -o /tmp/sins-wiki-pass.skill
mkdir -p ~/.codex/skills/sins-wiki-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-wiki-pass.skill').extractall(os.path.expanduser('~/.codex/skills/sins-wiki-pass'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-wiki-pass.skill \
  -o /tmp/sins-wiki-pass.skill
mkdir -p ~/.hermes/skills/sins-wiki-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-wiki-pass.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-wiki-pass'))
PY
```

### sins-llmwiki-auto (자동 기록 / 상시 발동)

`sins-wiki-pass`는 수동 발동("위키에 넣어줘")이다. **질문·답변·업무·제작 내용을 자동으로** 옵시디언 + Notion에 정리·기록하려면 `sins-llmwiki-auto`를 쓴다. 함께 설치 후, [`skill-list-docs/llm-wiki-autosave.md`](skill-list-docs/llm-wiki-autosave.md)의 규칙 블록을 `~/.claude/CLAUDE.md`(또는 프로젝트 CLAUDE.md) 끝에 붙여넣으면 매 세션 영구 상시 발동.

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-llmwiki-auto.skill \
  -o /tmp/sins-llmwiki-auto.skill
mkdir -p ~/.claude/skills/sins-llmwiki-auto
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-llmwiki-auto.skill').extractall(os.path.expanduser('~/.claude/skills/sins-llmwiki-auto'))
PY
```


- 지식·정보성 답변 → 자동 위키 노트
- 마케팅 기획·전략·카피·리서치 → `concept`/`moc` 요약
- 카드뉴스·웹·랜딩·PT·이미지 등 제작물 → `source` 메타 요약(산출물 경로 포함)
- 인사·단순확인·잡담 → 제외
- 끄기: 대화 중 `위키 자동저장 꺼` / `wiki off`
- 토큰 영향(추정): 세션 평균 **+20~35%**

### sins-loopass-setup (루프 엔지니어링 셋업 위저드)

자율 AI 에이전트 루프를 6단계 인터뷰(트리거→행동→검증→정지조건→아키텍처→산출)로 설계·세팅한다. 각 단계마다 핵심 질문 + 추가할 스킬·MCP를 함께 묻고, 마지막에 정지조건 4종(검증 통과 / max_iterations / 예산 / no-progress)이 코드에 박힌 실행 가능한 루프 스킬을 자동 생성한다.

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-loopass-setup.skill \
  -o /tmp/sins-loopass-setup.skill
mkdir -p ~/.claude/skills/sins-loopass-setup
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-loopass-setup.skill').extractall(os.path.expanduser('~/.claude/skills/sins-loopass-setup'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-loopass-setup.skill \
  -o /tmp/sins-loopass-setup.skill
mkdir -p ~/.codex/skills/sins-loopass-setup
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-loopass-setup.skill').extractall(os.path.expanduser('~/.codex/skills/sins-loopass-setup'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-loopass-setup.skill \
  -o /tmp/sins-loopass-setup.skill
mkdir -p ~/.hermes/skills/sins-loopass-setup
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-loopass-setup.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-loopass-setup'))
PY
```

## 설치 확인

Claude Code:

```bash
ls ~/.claude/skills/
```

Codex:

```bash
ls ~/.codex/skills/
```

Hermes:

```bash
ls ~/.hermes/skills/
```

Codex에서는 `@` 파일 참조로 스킬을 불러옵니다.

```text
@~/.codex/skills/sins-web-pt/SKILL.md 위 내용대로 실행해줘
```

## 요구사항

| 도구 | 설치 링크 | 지원 OS |
|------|-----------|---------|
| Claude Code | [claude.ai/code](https://claude.ai/code) | macOS / Linux |
| Codex CLI | [openai.com/codex](https://openai.com/codex) | macOS / Linux |
| Hermes | [atomicbot.ai](https://atomicbot.ai) | macOS / Linux |

---

## 설정 동기화 (다른 기기에서 동일 환경 구성)

`CLAUDE.md` 페르소나와 caveman 자동 활성화 hook을 새 기기에 적용합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-config-apply.sh | bash
```

적용 내용:
- `~/CLAUDE.md` — 역할 페르소나, caveman mode, 작업 하네스 원칙
- `~/.claude/settings.json` — SessionStart hook (세션 시작 시 caveman full 자동 활성화)

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
| `sins-wiki-pass.skill` | `/sins-wiki-pass` | Obsidian "LLM Wiki" 볼트와 Notion 위키 DB 동시 저장·동기화 |

## 함께 설치되는 외부 오픈소스 스킬

한 줄 설치와 수동 설치는 SINS 스킬 설치 후 아래 외부 스킬도 같이 설치합니다. (Hermes 대상은 gstack·superpowers·caveman 등을 자체 번들로 이미 제공하므로 외부 스킬 설치를 건너뛰고 SINS 스킬만 설치합니다.)

| 이름 | 대상 | 출처 |
|------|------|------|
| Caveman | Claude 전용 | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) |
| Frontend Slides | Claude 전용 | [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) |
| Grill Me | Claude 전용 | [mattpocock/skills](https://github.com/mattpocock/skills) |
| Handoff | Claude 전용 | [mattpocock/skills](https://github.com/mattpocock/skills) |
| Harness | Claude 전용 | [revfactory/harness](https://github.com/revfactory/harness) |
| gstack | Claude / Codex | [garrytan/gstack](https://github.com/garrytan/gstack) |
| Superpowers | Claude / Codex | [obra/superpowers](https://github.com/obra/superpowers) |
| Insane Search | Codex 전용 | [sinmb79/codex-insane-search](https://github.com/sinmb79/codex-insane-search) |
| Insane Search | Claude 전용 | [fivetaku/insane-search](https://github.com/fivetaku/insane-search) |

외부 스킬 설치를 건너뛰려면 다음처럼 실행합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | SINS_SKIP_EXTERNAL=1 bash -s -- claude
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

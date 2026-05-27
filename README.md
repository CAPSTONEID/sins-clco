# SINS Claude & Codex 스킬 패키지

SINS 프로젝트용 Claude Code 및 Codex 스킬 패키지입니다.

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

## 한 줄 설치

### Claude Code

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- claude
```

### Codex

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- codex
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

## 개별 스킬 설치

### Claude Code 준비

```bash
mkdir -p ~/.claude/skills
```

### Codex 준비

```bash
mkdir -p ~/.codex/skills
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

## 설치 확인

Claude Code:

```bash
ls ~/.claude/skills/
```

Codex:

```bash
ls ~/.codex/skills/
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

# SINS Claude Skills

SINS 프로젝트용 Claude Code 스킬 모음입니다.

## 포함된 스킬

| 파일 | 스킬 이름 | 설명 |
|------|-----------|------|
| `sins-card-news-creator.skill` | 카드뉴스 제작 | 인스타그램 카드뉴스 자동 제작 |
| `sins-imgvideo-prompt.skill` | 이미지/영상 프롬프트 | AI 이미지·영상 서비스용 프롬프트 생성 |
| `sins-marketing-team.skill` | 마케팅 팀 | 마케팅 전략 팀 구성 및 실행 |
| `sins-research-team.skill` | 리서치 팀 | 리서치·분석 팀 구성 및 실행 |
| `sins-web-pt.skill` | 웹 프레젠테이션 | 스크립트 기반 웹 발표자료 제작 |

---

## 설치 방법

### 방법 1 — 한 줄 설치 (권장)

터미널에서 아래 명령어를 실행하면 모든 스킬이 자동으로 설치됩니다.

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-claude/main/install.sh | bash
```

### 방법 2 — 수동 설치

```bash
# 스킬 디렉토리 생성
mkdir -p ~/.claude/skills

# 리포 클론 후 복사
git clone https://github.com/CAPSTONEID/sins-claude.git /tmp/sins-claude
cp /tmp/sins-claude/*.skill ~/.claude/skills/
rm -rf /tmp/sins-claude

echo "✅ 설치 완료"
```

### 방법 3 — 개별 스킬 설치

원하는 스킬만 골라서 설치할 수 있습니다.

```bash
mkdir -p ~/.claude/skills

# 카드뉴스 제작 스킬
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-card-news-creator.skill \
  -o ~/.claude/skills/sins-card-news-creator.skill

# 이미지/영상 프롬프트 스킬
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-imgvideo-prompt.skill \
  -o ~/.claude/skills/sins-imgvideo-prompt.skill

# 마케팅 팀 스킬
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-marketing-team.skill \
  -o ~/.claude/skills/sins-marketing-team.skill

# 리서치 팀 스킬
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-research-team.skill \
  -o ~/.claude/skills/sins-research-team.skill

# 웹 프레젠테이션 스킬
curl -L https://github.com/CAPSTONEID/sins-claude/raw/main/sins-web-pt.skill \
  -o ~/.claude/skills/sins-web-pt.skill
```

---

## 설치 확인

설치 후 Claude Code를 재시작하면 스킬이 자동으로 로드됩니다.

```bash
# 설치된 스킬 목록 확인
ls ~/.claude/skills/
```

---

## 사용법

Claude Code 터미널에서 `/` 를 입력하면 설치된 스킬 목록이 표시됩니다.

```
/sins-card-news-creator   → 카드뉴스 제작 시작
/sins-imgvideo-prompt     → 이미지/영상 프롬프트 생성
/sins-marketing-team      → 마케팅 팀 구성
/sins-research-team       → 리서치 팀 구성
/sins-web-pt              → 웹 프레젠테이션 제작
```

---

## 요구사항

- [Claude Code](https://claude.ai/code) CLI 설치 필요
- macOS / Linux 지원

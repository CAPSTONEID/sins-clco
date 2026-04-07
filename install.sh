#!/usr/bin/env bash
set -e

REPO="https://github.com/CAPSTONEID/sins-claude/raw/main/skill"
SKILL_DIR="$HOME/.claude/skills"

SKILLS=(
  "sins-harness-code.skill"
  "sins-card-news-creator.skill"
  "sins-imgvideo-prompt.skill"
  "sins-marketing-team.skill"
  "sins-research-team.skill"
  "sins-web-pt.skill"
)

echo "📦 SINS Claude 스킬 설치 중..."
mkdir -p "$SKILL_DIR"

for skill in "${SKILLS[@]}"; do
  echo "  → $skill 다운로드 중..."
  curl -fsSL "$REPO/$skill" -o "$SKILL_DIR/$skill"
done

echo ""
echo "✅ 설치 완료! 총 ${#SKILLS[@]}개 스킬이 $SKILL_DIR 에 설치되었습니다."
echo "   Claude Code를 재시작하면 스킬을 사용할 수 있습니다."

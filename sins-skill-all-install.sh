#!/usr/bin/env bash
set -e

REPO="https://github.com/CAPSTONEID/sins-claude/raw/main/skill-list"
SKILL_DIR="$HOME/.claude/skills"

SKILLS=(
  "sins-harness-code"
  "sins-card-news-creator"
  "sins-imgvideo-prompt"
  "sins-marketing-team"
  "sins-research-team"
  "sins-web-pt"
  "sins-press-release"
  "sins-muti-creator"
)

echo "📦 SINS Claude 스킬 설치 중..."
mkdir -p "$SKILL_DIR"

TMP_DIR=$(mktemp -d)

for skill in "${SKILLS[@]}"; do
  echo "  → $skill 설치 중..."
  TMP_FILE="$TMP_DIR/$skill.skill"
  curl -fsSL "$REPO/$skill.skill" -o "$TMP_FILE"
  mkdir -p "$SKILL_DIR/$skill"
  unzip -o -q "$TMP_FILE" -d "$SKILL_DIR/$skill"
  rm "$TMP_FILE"
done

rm -rf "$TMP_DIR"

echo ""
echo "✅ 설치 완료! 총 ${#SKILLS[@]}개 스킬이 $SKILL_DIR 에 설치되었습니다."
echo "   Claude Code를 재시작하면 스킬을 사용할 수 있습니다."

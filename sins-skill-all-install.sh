#!/usr/bin/env bash
set -e

REPO="https://github.com/CAPSTONEID/sins-claude/raw/main/skill-list"
API="https://api.github.com/repos/CAPSTONEID/sins-claude/contents/skill-list"
SKILL_DIR="$HOME/.claude/skills"

echo "🔍 SINS Claude 스킬 목록 조회 중..."

# GitHub API로 skill-list의 .skill 파일 자동 감지
SKILLS=$(curl -fsSL "$API" | python3 -c "
import json, sys
files = json.load(sys.stdin)
for f in files:
    if f['name'].endswith('.skill'):
        print(f['name'])
")

if [ -z "$SKILLS" ]; then
  echo "❌ 스킬 목록을 가져오지 못했습니다. 네트워크 연결을 확인해주세요."
  exit 1
fi

SKILL_COUNT=$(echo "$SKILLS" | wc -l | tr -d ' ')
echo "✅ ${SKILL_COUNT}개 스킬 발견"
echo ""

mkdir -p "$SKILL_DIR"
TMP_DIR=$(mktemp -d)

while IFS= read -r skill_file; do
  skill_name="${skill_file%.skill}"
  echo "  → $skill_name 설치 중..."
  TMP_FILE="$TMP_DIR/$skill_file"
  curl -fsSL "$REPO/$skill_file" -o "$TMP_FILE"
  mkdir -p "$SKILL_DIR/$skill_name"
  unzip -o -q "$TMP_FILE" -d "$SKILL_DIR/$skill_name"
  rm "$TMP_FILE"
done <<< "$SKILLS"

rm -rf "$TMP_DIR"

echo ""
echo "✅ 설치 완료! 총 ${SKILL_COUNT}개 스킬이 $SKILL_DIR 에 설치되었습니다."
echo "   Claude Code를 재시작하면 스킬을 사용할 수 있습니다."

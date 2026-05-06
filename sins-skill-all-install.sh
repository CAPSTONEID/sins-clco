#!/usr/bin/env bash
set -euo pipefail

REPO_RAW="https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list"
API="https://api.github.com/repos/CAPSTONEID/sins-clco/contents/skill-list"
TARGET="${1:-claude}"

case "$TARGET" in
  claude)
    SKILL_DIR="$HOME/.claude/skills"
    INSTALL_MODE="unzip"
    LABEL="Claude Code"
    ;;
  codex)
    SKILL_DIR="$HOME/.codex/skills"
    INSTALL_MODE="unzip"
    LABEL="Codex"
    ;;
  hermes)
    SKILL_DIR="$HOME/.hermes/skills/sins"
    INSTALL_MODE="unzip"
    LABEL="Hermes Agent"
    ;;
  *)
    echo "사용법: $0 [claude|codex|hermes]"
    echo "예시: $0 hermes"
    exit 1
    ;;
esac

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl이 필요합니다. 먼저 curl을 설치해주세요."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ python3가 필요합니다. 먼저 Python 3를 설치해주세요."
  exit 1
fi

echo "🔍 SINS 스킬 목록 조회 중... 대상: ${LABEL}"

SKILLS=$(curl -fsSL "$API" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if not isinstance(data, list):
    msg = data.get('message', 'unknown GitHub API response') if isinstance(data, dict) else 'unknown GitHub API response'
    print(f'GitHub API 오류: {msg}', file=sys.stderr)
    sys.exit(1)
for f in data:
    if isinstance(f, dict) and f.get('name', '').endswith('.skill'):
        print(f['name'])
")

if [ -z "$SKILLS" ]; then
  echo "❌ 스킬 목록을 가져오지 못했습니다. 네트워크 연결을 확인해주세요."
  exit 1
fi

SKILL_COUNT=$(printf '%s\n' "$SKILLS" | wc -l | tr -d ' ')
echo "✅ ${SKILL_COUNT}개 스킬 발견"
echo "📁 설치 위치: $SKILL_DIR"
echo ""

mkdir -p "$SKILL_DIR"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

while IFS= read -r skill_file; do
  [ -z "$skill_file" ] && continue
  skill_name="${skill_file%.skill}"
  echo "  → $skill_name 설치 중..."
  tmp_file="$TMP_DIR/$skill_file"
  curl -fsSL "$REPO_RAW/$skill_file" -o "$tmp_file"

  case "$INSTALL_MODE" in
    unzip)
      mkdir -p "$SKILL_DIR/$skill_name"
      python3 - "$tmp_file" "$SKILL_DIR/$skill_name" <<'PY'
import sys, zipfile
from pathlib import PurePosixPath

zip_path, dest = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(zip_path) as zf:
    for info in zf.infolist():
        name = info.filename
        path = PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts:
            raise SystemExit(f'위험한 ZIP 경로 차단: {name}')
    zf.extractall(dest)
PY
      ;;
  esac
done <<< "$SKILLS"

echo ""
echo "✅ 설치 완료! 총 ${SKILL_COUNT}개 스킬이 $SKILL_DIR 에 설치되었습니다."
case "$TARGET" in
  claude)
    echo "   Claude Code를 재시작하면 /sins-* 스킬을 사용할 수 있습니다."
    ;;
  codex)
    echo "   Codex에서 @${SKILL_DIR}/sins-web-pt/SKILL.md 처럼 파일 참조로 사용할 수 있습니다."
    ;;
  hermes)
    echo "   Hermes CLI를 재시작하거나 /reset 후 /skill sins-web-pt 또는 자동 스킬 로딩으로 사용할 수 있습니다."
    echo "   Hermes가 없다면: curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash"
    ;;
esac

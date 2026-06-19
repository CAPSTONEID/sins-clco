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
    SKILL_DIR="$HOME/.hermes/skills"
    INSTALL_MODE="unzip"
    LABEL="Hermes"
    ;;
  *)
    echo "사용법: $0 [claude|codex|hermes]"
    echo "예시: $0 claude"
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

if [ "${SINS_SKIP_EXTERNAL:-0}" != "1" ] && ! command -v git >/dev/null 2>&1; then
  echo "❌ 외부 스킬 설치에는 git이 필요합니다. git을 설치하거나 SINS_SKIP_EXTERNAL=1 로 외부 설치를 건너뛰세요."
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

copy_dir_clean() {
  src="$1"
  dest="$2"
  rm -rf "$dest"
  mkdir -p "$(dirname "$dest")"
  cp -R "$src" "$dest"
}

clone_external_repo() {
  name="$1"
  repo="$2"
  dest="$TMP_DIR/external-$name"
  echo "  → 외부 소스 받는 중: $name" >&2
  # LFS 대용량(예: hyperframes 테스트 베이스라인) smudge를 건너뛰어 빠르고 가볍게 clone
  GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 "$repo" "$dest" >/dev/null 2>&1
  printf '%s\n' "$dest"
}

copy_frontend_slides() {
  repo_dir="$1"
  dest="$SKILL_DIR/frontend-slides"
  rm -rf "$dest"
  mkdir -p "$dest/scripts"
  cp "$repo_dir/SKILL.md" "$dest/"
  cp "$repo_dir/STYLE_PRESETS.md" "$dest/"
  cp "$repo_dir/viewport-base.css" "$dest/"
  cp "$repo_dir/html-template.md" "$dest/"
  cp "$repo_dir/animation-patterns.md" "$dest/"
  cp -R "$repo_dir/bold-template-pack" "$dest/"
  cp -R "$repo_dir/scripts" "$dest/"
}

copy_uiux_skill() {
  repo_dir="$1"
  dest="$SKILL_DIR/ui-ux-pro-max"
  # data/scripts가 src/ 로의 심볼릭링크라 -L 로 실제 파일까지 복사해 풀어줌
  rm -rf "$dest"
  mkdir -p "$(dirname "$dest")"
  cp -RL "$repo_dir/.claude/skills/ui-ux-pro-max" "$dest"
}

copy_all_skill_dirs() {
  repo_dir="$1"
  source_dir="$2"
  prefix="$3"
  if [ ! -d "$repo_dir/$source_dir" ]; then
    return 0
  fi
  find "$repo_dir/$source_dir" -mindepth 1 -maxdepth 1 -type d | sort | while IFS= read -r skill_path; do
    if [ -f "$skill_path/SKILL.md" ]; then
      skill_base="$(basename "$skill_path")"
      copy_dir_clean "$skill_path" "$SKILL_DIR/${prefix}${skill_base}"
    fi
  done
}

copy_gstack_fallback_skills() {
  repo_dir="$1"
  find "$repo_dir" -mindepth 1 -maxdepth 2 -type f -name SKILL.md | sort | while IFS= read -r skill_file; do
    skill_dir="$(dirname "$skill_file")"
    if [ "$skill_dir" = "$repo_dir" ]; then
      continue
    fi
    rel="${skill_dir#$repo_dir/}"
    case "$rel" in
      test/*|docs/*|model-overlays/*|openclaw/*|claude|codex|gstack|agents|external-gstack)
        continue
        ;;
    esac
    skill_base="$(basename "$skill_dir")"
    copy_dir_clean "$skill_dir" "$SKILL_DIR/gstack-$skill_base"
  done
}

install_gstack() {
  repo_dir="$1"
  dest="$SKILL_DIR/gstack"
  copy_dir_clean "$repo_dir" "$dest"
  copy_gstack_fallback_skills "$repo_dir"
  if [ "${SINS_RUN_GSTACK_SETUP:-0}" != "1" ]; then
    echo "  → gstack 스킬 복사 완료. 전체 setup은 SINS_RUN_GSTACK_SETUP=1 일 때만 실행합니다."
    return 0
  fi
  if command -v bun >/dev/null 2>&1 && [ -x "$dest/setup" ]; then
    echo "  → gstack setup 실행 중..."
    if ! (cd "$dest" && ./setup --host "$TARGET" --quiet --prefix); then
      echo "  ⚠️ gstack setup 실패. 기본 스킬 복사 방식으로 진행합니다."
    fi
  else
    echo "  ⚠️ bun이 없어 gstack setup은 건너뜁니다."
  fi
}

install_oh_my_design() {
  # oh-my-design — 286개 실제 기업 디자인 레퍼런스 기반 디자인 시스템 스킬/서브에이전트.
  # 자체 npx CLI로 채널별 설치. Claude는 claude-code 채널, Codex는 codex 채널만 설치한다.
  # (Claude: ~/.claude/skills · agents · data / Codex: ~/.agents/skills · ~/.codex/agents · ~/.codex/data)
  case "$TARGET" in
    claude) omd_channel="claude-code" ;;
    codex)  omd_channel="codex" ;;
    *) return 0 ;;
  esac

  if [ "${SINS_SKIP_OMD:-0}" = "1" ]; then
    echo "  ⏭️ oh-my-design 설치를 건너뜁니다. (SINS_SKIP_OMD=1)"
    return 0
  fi

  if ! command -v npx >/dev/null 2>&1; then
    echo "  ⚠️ npx(Node.js)가 없어 oh-my-design 설치를 건너뜁니다. Node.js 설치 후 다시 실행하거나 SINS_SKIP_OMD=1 로 건너뛰세요."
    return 0
  fi

  echo "  → oh-my-design 설치 중 (채널: ${omd_channel})..."
  if npx -y oh-my-design-cli@latest install-skills --agent "$omd_channel" --all --global; then
    echo "  ✅ oh-my-design 설치 완료"
  else
    echo "  ⚠️ oh-my-design 설치 실패. 계속 진행합니다."
  fi
}

install_external_skills() {
  if [ "${SINS_SKIP_EXTERNAL:-0}" = "1" ]; then
    echo ""
    echo "⏭️ 외부 스킬 설치를 건너뜁니다. (SINS_SKIP_EXTERNAL=1)"
    return 0
  fi

  if [ "$TARGET" = "hermes" ]; then
    echo ""
    echo "⏭️ Hermes는 gstack·superpowers·caveman 등 외부 스킬을 자체 번들로 이미 제공하므로 건너뜁니다."
    echo "   (기존 ${SKILL_DIR} 의 스킬을 덮어쓰지 않습니다.)"
    return 0
  fi

  echo ""
  echo "🌐 외부 오픈소스 스킬 설치 중..."

  if [ "$TARGET" = "claude" ]; then
    caveman_dir="$(clone_external_repo caveman https://github.com/JuliusBrussee/caveman.git)"
    copy_all_skill_dirs "$caveman_dir" "skills" ""

    frontend_dir="$(clone_external_repo frontend-slides https://github.com/zarazhangrui/frontend-slides.git)"
    copy_frontend_slides "$frontend_dir"

    matt_dir="$(clone_external_repo mattpocock-skills https://github.com/mattpocock/skills.git)"
    copy_dir_clean "$matt_dir/skills/productivity/grill-me" "$SKILL_DIR/grill-me"
    copy_dir_clean "$matt_dir/skills/productivity/handoff" "$SKILL_DIR/handoff"

    claude_insane_dir="$(clone_external_repo claude-insane-search https://github.com/fivetaku/insane-search.git)"
    copy_dir_clean "$claude_insane_dir/skills/insane-search" "$SKILL_DIR/insane-search"

    harness_dir="$(clone_external_repo harness https://github.com/revfactory/harness.git)"
    copy_dir_clean "$harness_dir/skills/harness" "$SKILL_DIR/harness"

    # UI/UX Pro Max — Claude 전용 디자인 인텔리전스 스킬
    uiux_dir="$(clone_external_repo ui-ux-pro-max https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git)"
    copy_uiux_skill "$uiux_dir"

    # Humanize Korean — AI 한글 윤문. Claude는 Fast + strict 5인 파이프라인(서브에이전트 12개)
    hk_dir="$(clone_external_repo im-not-ai https://github.com/epoko77-ai/im-not-ai.git)"
    for s in humanize-korean humanize humanize-redo; do
      copy_dir_clean "$hk_dir/.claude/skills/$s" "$SKILL_DIR/$s"
    done
    mkdir -p "$HOME/.claude/agents"
    cp "$hk_dir"/agents/*.md "$HOME/.claude/agents/"
  fi

  if [ "$TARGET" = "codex" ]; then
    codex_insane_dir="$(clone_external_repo codex-insane-search https://github.com/sinmb79/codex-insane-search.git)"
    copy_dir_clean "$codex_insane_dir/plugins/insane-search/skills/insane-search" "$SKILL_DIR/insane-search"
    copy_dir_clean "$codex_insane_dir/plugins/insane-search" "$HOME/.codex/plugins/insane-search"

    # Humanize Korean — AI 한글 윤문. Codex는 Fast(단일 호출) 모드만. references 심링크는 실체로 복사(-L)
    hk_dir="$(clone_external_repo im-not-ai https://github.com/epoko77-ai/im-not-ai.git)"
    rm -rf "$SKILL_DIR/humanize-korean"
    mkdir -p "$SKILL_DIR"
    cp -RL "$hk_dir/codex/skills/humanize-korean" "$SKILL_DIR/humanize-korean"
  fi

  # HyperFrames — Claude / Codex 공용. HTML→MP4 영상 제작 스킬 묶음(16개)
  hyperframes_dir="$(clone_external_repo hyperframes https://github.com/heygen-com/hyperframes.git)"
  copy_all_skill_dirs "$hyperframes_dir" "skills" ""

  gstack_dir="$(clone_external_repo gstack https://github.com/garrytan/gstack.git)"
  install_gstack "$gstack_dir"

  superpowers_dir="$(clone_external_repo superpowers https://github.com/obra/superpowers.git)"
  copy_all_skill_dirs "$superpowers_dir" "skills" "superpowers-"

  # oh-my-design — Claude / Codex 채널별 디자인 시스템 스킬(자체 npx 설치)
  install_oh_my_design

  echo "✅ 외부 오픈소스 스킬 설치 완료"
}

while IFS= read -r skill_file; do
  [ -z "$skill_file" ] && continue
  skill_name="${skill_file%.skill}"
  echo "  → $skill_name 설치 중..."
  tmp_file="$TMP_DIR/$skill_file"
  curl -fsSL "$REPO_RAW/$skill_file" -o "$tmp_file"

  case "$INSTALL_MODE" in
    unzip)
      # 기존 설치본을 먼저 제거해 옛 구조(중첩 등)가 머지로 남지 않게 함
      rm -rf "$SKILL_DIR/$skill_name"
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

install_external_skills

echo ""
echo "✅ 설치 완료! 총 ${SKILL_COUNT}개 스킬이 $SKILL_DIR 에 설치되었습니다."
echo "   /sins-web-pt는 Lazyweb 레퍼런스와 frontend-slides 뷰포트 규칙을 기반으로 HTML 웹 프레젠테이션과 TXT 대본을 생성하며, PPTX 입력도 추출해 재구성합니다."
case "$TARGET" in
  claude)
    echo "   Claude Code를 재시작하면 /sins-* 스킬을 사용할 수 있습니다."
    ;;
  codex)
    echo "   Codex에서 @${SKILL_DIR}/sins-web-pt/SKILL.md 또는 @${SKILL_DIR}/sins-card-news-creator/SKILL.md 처럼 파일 참조로 사용할 수 있습니다."
    ;;
  hermes)
    echo "   Hermes를 재시작하면 ${SKILL_DIR} 의 /sins-* 스킬을 사용할 수 있습니다."
    ;;
esac

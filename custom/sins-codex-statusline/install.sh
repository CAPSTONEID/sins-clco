#!/usr/bin/env bash
set -euo pipefail

SINS_REPO_URL="${SINS_REPO_URL:-https://github.com/CAPSTONEID/sins-clco}"
SINS_REPO_REF="${SINS_REPO_REF:-main}"
CODEX_REPO_URL="${CODEX_REPO_URL:-https://github.com/openai/codex.git}"
CODEX_REPO_REF="${CODEX_REPO_REF:-main}"
INSTALL_BIN_DIR="${INSTALL_BIN_DIR:-$HOME/.codex/bin}"
INSTALL_BIN_NAME="${INSTALL_BIN_NAME:-sins-codex}"
CODEX_CONFIG_FILE="${CODEX_CONFIG_FILE:-$HOME/.codex/config.toml}"
PATCH_REL_PATH="custom/sins-codex-statusline/sins-codex-statusline.patch"

STATUS_LINE='status_line = ["model-with-reasoning", "five-hour-limit", "weekly-limit", "context-remaining", "context-used", "current-dir", "git-branch"]'

log() {
  printf '%s\n' "$*"
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

fetch_patch() {
  local dest="$1"
  local script_dir=""

  if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || true)"
  fi

  if [[ -n "$script_dir" && -f "$script_dir/sins-codex-statusline.patch" ]]; then
    cp "$script_dir/sins-codex-statusline.patch" "$dest"
    return
  fi

  local raw_url="${SINS_REPO_URL/github.com/raw.githubusercontent.com}/${SINS_REPO_REF}/${PATCH_REL_PATH}"
  curl -fsSL "$raw_url" -o "$dest"
}

update_config() {
  mkdir -p "$(dirname "$CODEX_CONFIG_FILE")"

  if [[ -f "$CODEX_CONFIG_FILE" ]]; then
    cp "$CODEX_CONFIG_FILE" "${CODEX_CONFIG_FILE}.bak.$(date +%Y%m%d%H%M%S)"
  else
    touch "$CODEX_CONFIG_FILE"
  fi

  local tmp_config
  tmp_config="$(mktemp)"

  awk -v status_line="$STATUS_LINE" '
    BEGIN {
      in_tui = 0
      saw_tui = 0
      wrote_status = 0
    }
    /^\[tui\][[:space:]]*$/ {
      saw_tui = 1
      in_tui = 1
      print
      next
    }
    /^\[/ {
      if (in_tui && !wrote_status) {
        print status_line
        wrote_status = 1
      }
      in_tui = 0
      print
      next
    }
    in_tui && /^[[:space:]]*status_line[[:space:]]*=/ {
      if (!wrote_status) {
        print status_line
        wrote_status = 1
      }
      next
    }
    { print }
    END {
      if (saw_tui && in_tui && !wrote_status) {
        print status_line
        wrote_status = 1
      }
      if (!saw_tui) {
        print ""
        print "[tui]"
        print status_line
      }
    }
  ' "$CODEX_CONFIG_FILE" > "$tmp_config"

  mv "$tmp_config" "$CODEX_CONFIG_FILE"
}

ensure_path_hint() {
  case ":${PATH:-}:" in
    *":$INSTALL_BIN_DIR:"*) return ;;
  esac

  local shell_rc="$HOME/.zshrc"
  if [[ "${SINS_CODEX_UPDATE_SHELL_RC:-1}" == "1" && -f "$shell_rc" ]]; then
    if ! grep -Fq 'SINS Codex statusline' "$shell_rc"; then
      {
        printf '\n# SINS Codex statusline\n'
        printf 'export PATH="$HOME/.codex/bin:$PATH"\n'
      } >> "$shell_rc"
      log "Added $INSTALL_BIN_DIR to PATH in $shell_rc. Restart your terminal or run: source $shell_rc"
      return
    fi
  fi

  log "Add this to your shell PATH if needed: export PATH=\"$INSTALL_BIN_DIR:\$PATH\""
}

main() {
  need_cmd git
  need_cmd cargo
  need_cmd curl
  need_cmd awk

  local workdir patch_file
  workdir="$(mktemp -d)"
  patch_file="$workdir/sins-codex-statusline.patch"

  trap 'rm -rf "$workdir"' EXIT

  log "Downloading SINS Codex statusline patch..."
  fetch_patch "$patch_file"

  log "Cloning OpenAI Codex source..."
  git clone --depth 1 --branch "$CODEX_REPO_REF" "$CODEX_REPO_URL" "$workdir/codex"

  log "Applying statusline patch..."
  (
    cd "$workdir/codex"
    git apply "$patch_file"
    cargo fmt --manifest-path codex-rs/Cargo.toml -p codex-tui
    cargo build --manifest-path codex-rs/Cargo.toml --release --bin codex
  )

  mkdir -p "$INSTALL_BIN_DIR"
  cp "$workdir/codex/codex-rs/target/release/codex" "$INSTALL_BIN_DIR/$INSTALL_BIN_NAME"
  chmod +x "$INSTALL_BIN_DIR/$INSTALL_BIN_NAME"

  update_config
  ensure_path_hint

  log ""
  log "Installed: $INSTALL_BIN_DIR/$INSTALL_BIN_NAME"
  log "Config updated: $CODEX_CONFIG_FILE"
  log "Run with: $INSTALL_BIN_NAME"
}

main "$@"

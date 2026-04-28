#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

git apply "$SCRIPT_DIR/sins-codex-statusline.patch"
cargo fmt -p codex-tui
cargo build --bin codex

echo "Built custom Codex binary at: $(pwd)/target/debug/codex"

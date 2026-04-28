#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

git apply "$SCRIPT_DIR/sins-codex-statusline.patch"
cargo fmt --manifest-path codex-rs/Cargo.toml -p codex-tui
cargo build --manifest-path codex-rs/Cargo.toml --bin codex

echo "Built custom Codex binary at: $(pwd)/codex-rs/target/debug/codex"

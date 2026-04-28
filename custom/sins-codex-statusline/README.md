# sins-codex-statusline

Codex CLI TUI status line custom patch.

## What This Changes

- Korean labels for the Codex status line.
- Two-line status line layout:
  - Line 1: model, primary rate limit, secondary rate limit.
  - Line 2: context remaining, context used, current folder, git branch.
- Colored status line segments.
- Percent bars using `█` and `░`.
- Primary limit duration comes from the server window, with reset shown as local time.
- Secondary limit duration comes from the server window, with reset shown as `HH:MM on YY-MM-DD DDD`.

Example:

```text
◆ 모델 gpt-5.5 default  │  5시간 한도 남음 ████░░░░░░ 38% 리셋 13:50  │  7일 한도 남음 █████████░ 90% 리셋 08:50 on 26-04-28 Tue
남은맥락 ██████████ 100%  │  맥락사용 ░░░░░░░░░░ 0%  │  📁 폴더 ~  │  🌿 브랜치 main
```

## One-Line Install

This clones the OpenAI Codex source into a temporary directory, applies the
status line patch, builds a custom release binary, installs it as
`~/.codex/bin/sins-codex`, and updates `~/.codex/config.toml`.

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/custom/sins-codex-statusline/install.sh | bash
```

Then run:

```bash
sins-codex
```

If your shell cannot find `sins-codex`, restart the terminal or run:

```bash
source ~/.zshrc
```

## Manual Apply

From an OpenAI Codex CLI source checkout:

```bash
git apply /path/to/sins-codex-statusline.patch
cargo fmt --manifest-path codex-rs/Cargo.toml -p codex-tui
cargo build --manifest-path codex-rs/Cargo.toml --bin codex
```

Then run the built binary:

```bash
./codex-rs/target/debug/codex
```

## Config

The one-line installer updates this automatically. For manual installs, add or
update `~/.codex/config.toml`:

```toml
[tui]
status_line = ["model-with-reasoning", "five-hour-limit", "weekly-limit", "context-remaining", "context-used", "current-dir", "git-branch"]
```

## Installer Options

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/custom/sins-codex-statusline/install.sh \
  | CODEX_REPO_REF=main INSTALL_BIN_NAME=sins-codex bash
```

- `CODEX_REPO_REF`: OpenAI Codex git ref to build from. Default: `main`.
- `INSTALL_BIN_DIR`: install directory. Default: `~/.codex/bin`.
- `INSTALL_BIN_NAME`: installed command name. Default: `sins-codex`.
- `CODEX_CONFIG_FILE`: Codex config path. Default: `~/.codex/config.toml`.
- `SINS_CODEX_UPDATE_SHELL_RC=0`: do not update `~/.zshrc`.

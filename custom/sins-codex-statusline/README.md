# sins-codex-statusline

Codex CLI TUI status line custom patch.

## What This Changes

- Korean labels for the Codex status line.
- Two-line status line layout:
  - Line 1: model, 5-hour limit, 7-day limit.
  - Line 2: context remaining, context used, current folder, git branch.
- Colored status line segments.
- Percent bars using `█` and `░`.
- 5-hour reset shown as local time.
- 7-day reset shown as `HH:MM on YY-MM-DD DDD`.

Example:

```text
◆ 모델 gpt-5.5 default  │  5시간 ████░░░░░░ 38% 리셋 13:50  │  7일 █████████░ 90% 리셋 08:50 on 26-04-28 Tue
남은맥락 ██████████ 100%  │  맥락사용 ░░░░░░░░░░ 0%  │  📁 폴더 ~  │  🌿 브랜치 main
```

## Apply

From an OpenAI Codex CLI source checkout:

```bash
git apply /path/to/sins-codex-statusline.patch
cargo fmt -p codex-tui
cargo build --bin codex
```

Then run the built binary:

```bash
./target/debug/codex
```

## Config

Add or update `~/.codex/config.toml`:

```toml
[tui]
status_line = ["model-with-reasoning", "five-hour-limit", "weekly-limit", "context-remaining", "context-used", "current-dir", "git-branch"]
```


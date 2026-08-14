#!/usr/bin/env bash
set -euo pipefail

REPO_RAW="https://github.com/CAPSTONEID/sins-clco/raw/main"

echo "📝 CLAUDE.md 적용 중..."
curl -fsSL "$REPO_RAW/config/CLAUDE.md" -o "$HOME/CLAUDE.md"
echo "✅ ~/CLAUDE.md 적용 완료"

if command -v grok >/dev/null 2>&1 || [ -d "$HOME/.grok" ]; then
  # Grok은 ~/.grok/rules/ 의 *.md 를 항상 홈 룰로 읽는다. (~/CLAUDE.md 는 스캔 대상이 아님)
  mkdir -p "$HOME/.grok/rules"
  cp "$HOME/CLAUDE.md" "$HOME/.grok/rules/sins-persona.md"
  echo "✅ ~/.grok/rules/sins-persona.md 적용 완료 (Grok 홈 룰 — caveman 모드 포함)"
fi

echo "⚙️  caveman SessionStart hook 적용 중..."
python3 - <<'PY'
import json, os

settings_path = os.path.expanduser('~/.claude/settings.json')
os.makedirs(os.path.dirname(settings_path), exist_ok=True)

try:
    with open(settings_path) as f:
        settings = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    settings = {}

caveman_command = """echo '{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "CAVEMAN MODE ACTIVE (full). Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries (sure/certainly/of course/happy to). Fragments OK. Short synonyms. Technical terms exact. Code blocks unchanged. Off only: stop caveman / normal mode."}}'"""

hooks = settings.setdefault('hooks', {})
session_start = hooks.setdefault('SessionStart', [])

for entry in session_start:
    for h in entry.get('hooks', []):
        if 'CAVEMAN MODE ACTIVE' in h.get('command', ''):
            print('ℹ️  caveman hook 이미 존재. 건너뜁니다.')
            exit(0)

caveman_hook = {"type": "command", "command": caveman_command, "timeout": 5}

if session_start:
    session_start[0]['hooks'].append(caveman_hook)
else:
    session_start.append({'matcher': '', 'hooks': [caveman_hook]})

with open(settings_path, 'w') as f:
    json.dump(settings, f, indent=2, ensure_ascii=False)
print('✅ caveman hook 추가 완료')
PY

echo ""
echo "✅ 설정 적용 완료!"
echo "   Claude Code 재시작하면 caveman mode 자동 활성화됩니다."
echo "   Grok은 ~/.grok/rules/sins-persona.md 로 같은 페르소나·caveman 규칙이 적용됩니다. (훅 없이 홈 룰로 상시 적용)"

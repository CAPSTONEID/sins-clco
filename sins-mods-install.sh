#!/usr/bin/env bash
# Claude Code CLI mods 설치: usage-band(입력창 위 사용량 게이지) + progress-pane(1분 넘는 작업 진행 바 패널)
set -euo pipefail

REPO_RAW="${SINS_REPO_RAW:-https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main}"
MODS_DIR="$HOME/.claude/mods"
FILES=(.claude-plugin/plugin.json hooks/hooks.json hooks/register.tsx types/index.d.ts)

for m in usage-band progress-pane; do
  echo "📦 $m 설치 중..."
  for f in "${FILES[@]}"; do
    mkdir -p "$MODS_DIR/$m/$(dirname "$f")"
    curl -fsSL "$REPO_RAW/mods/$m/$f" -o "$MODS_DIR/$m/$f"
  done
done

echo "⚙️  ~/.claude/settings.json 에 mods 경로 등록 중..."
python3 - <<'PY'
import json, os, shutil

p = os.path.expanduser('~/.claude/settings.json')
os.makedirs(os.path.dirname(p), exist_ok=True)
try:
    with open(p) as f:
        s = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    s = {}
if os.path.exists(p) and not os.path.exists(p + '.bak-sins-mods'):
    shutil.copy(p, p + '.bak-sins-mods')

env = s.setdefault('env', {})
dirs = [d for d in env.get('CLAUDE_CODE_PLUGIN_DIRS', '').split(':') if d]

# task-progress-band 는 usage-band 와 같은 입력창 위 영역을 그려 겹치므로 등록만 해제 (폴더는 유지)
removed = [d for d in dirs if d.rstrip('/').endswith('task-progress-band')]
dirs = [d for d in dirs if d not in removed]
for m in ('usage-band', 'progress-pane'):
    d = os.path.expanduser(f'~/.claude/mods/{m}')
    if d not in dirs:
        dirs.append(d)
env['CLAUDE_CODE_PLUGIN_DIRS'] = ':'.join(dirs)

with open(p, 'w') as f:
    json.dump(s, f, indent=2, ensure_ascii=False)
if removed:
    print('ℹ️  task-progress-band 등록 해제 (폴더는 그대로):', ', '.join(removed))
print('✅ CLAUDE_CODE_PLUGIN_DIRS =', env['CLAUDE_CODE_PLUGIN_DIRS'])
PY

if command -v claude >/dev/null 2>&1; then
  for m in usage-band progress-pane; do claude plugin validate "$MODS_DIR/$m" | tail -1; done
fi

echo ""
echo "✅ mods 설치 완료! 터미널에서 claude 를 새로 실행하세요."
echo "   입력창 위 게이지 = usage-band, /progress = 진행 바 패널"

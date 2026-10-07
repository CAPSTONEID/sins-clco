#!/usr/bin/env bash
# Claude Code mods 설치
#   usage-band         : 터미널(CLI) 입력창 위 사용량 게이지
#   task-progress-band : 데스크톱 앱(Code 탭) 입력창 위 Tasks·컨텍스트·5시간·7일 그라디언트 막대
#   progress-pane      : 작업 진행 바 + 렌더 진행 + 에이전트 관제 패널 (/progress)
#   hf-band            : 입력창 위 Higgsfield 크레딧·생성 대기 띠
#   ai-tell            : .md/.txt 저장 시 한글 AI 티 점수 (/aitell)
# 입력창 위 막대는 화면 종류로 나눠 그리므로 셋을 함께 켜도 겹치지 않는다
set -euo pipefail

REPO_RAW="${SINS_REPO_RAW:-https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main}"
MODS_DIR="$HOME/.claude/mods"
MODS=(usage-band task-progress-band progress-pane hf-band ai-tell)
FILES=(.claude-plugin/plugin.json hooks/hooks.json hooks/register.tsx types/index.d.ts)

# mod 별로 register.tsx 가 import 하는 추가 파일
extra_files() {
  case "$1" in
    progress-pane) echo hooks/render.ts hooks/run.ts hooks/agents.ts hooks/rollback.ts ;;
    hf-band | ai-tell) echo hooks/lib.ts ;;
  esac
}

for m in "${MODS[@]}"; do
  echo "📦 $m 설치 중..."
  # shellcheck disable=SC2046
  for f in "${FILES[@]}" $(extra_files "$m"); do
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

# 세 mod 모두 등록 (~ 표기·절대경로 어느 쪽으로 이미 있어도 중복 없음)
have = {os.path.expanduser(d).rstrip('/') for d in dirs}
for m in ('usage-band', 'task-progress-band', 'progress-pane', 'hf-band', 'ai-tell'):
    d = os.path.expanduser(f'~/.claude/mods/{m}')
    if d not in have:
        dirs.append(d)
env['CLAUDE_CODE_PLUGIN_DIRS'] = ':'.join(dirs)

with open(p, 'w') as f:
    json.dump(s, f, indent=2, ensure_ascii=False)
print('✅ CLAUDE_CODE_PLUGIN_DIRS =', env['CLAUDE_CODE_PLUGIN_DIRS'])
PY

if command -v claude >/dev/null 2>&1; then
  for m in "${MODS[@]}"; do claude plugin validate "$MODS_DIR/$m" | tail -1; done
fi

echo ""
echo "✅ mods 설치 완료! Claude Code 를 새 세션으로 여세요."
echo "   입력창 위 막대: 터미널 = usage-band, 데스크톱 앱 = task-progress-band"
echo "   (VS Code 확장 채팅 패널은 mod 화면 미지원 — VS Code 내장 터미널의 claude 는 usage-band)"
echo "   /progress = 작업 진행·렌더 패널, /aitell = AI 티 점수, 입력창 위 Higgsfield 띠"

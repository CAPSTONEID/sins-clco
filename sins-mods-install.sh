#!/usr/bin/env bash
# Claude Code mods 설치
#   usage-band         : 터미널(CLI) 입력창 위 사용량 게이지
#   task-progress-band : 데스크톱 앱(Code 탭) 입력창 위 Tasks·컨텍스트·5시간·7일 그라디언트 막대 (위에 usage-band 조작 줄)
#   progress-pane      : 네온 다크 흐름도 패널 — 메인 세션·Jev·서브에이전트 카드·세션 로그 (/progress)
# 입력창 위 막대는 화면 종류로 나눠 그리므로 함께 켜도 겹치지 않는다
# 예전에 설치한 hf-band·ai-tell 은 더 이상 배포하지 않아 이 스크립트가 지운다
set -euo pipefail

REPO_RAW="${SINS_REPO_RAW:-https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main}"
MODS_DIR="$HOME/.claude/mods"
MODS=(usage-band task-progress-band progress-pane)
REMOVED=(hf-band ai-tell)
FILES=(.claude-plugin/plugin.json hooks/hooks.json hooks/register.tsx types/index.d.ts)

# mod 별로 register.tsx 가 import 하는 추가 파일
extra_files() {
  case "$1" in
    progress-pane) echo hooks/flow.ts hooks/jev.ts hooks/render.ts hooks/run.ts hooks/agents.ts hooks/rollback.ts ;;
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

for m in "${REMOVED[@]}"; do
  [ -d "$MODS_DIR/$m" ] && rm -rf "${MODS_DIR:?}/$m" && echo "🗑  $m 삭제 (배포 중단)"
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

# 배포를 멈춘 mod 경로는 빼고 (~ 표기·절대경로 모두)
gone = {os.path.expanduser(f'~/.claude/mods/{m}') for m in ('hf-band', 'ai-tell')}
dirs = [d for d in dirs if os.path.expanduser(d).rstrip('/') not in gone]

# 세 mod 모두 등록 (~ 표기·절대경로 어느 쪽으로 이미 있어도 중복 없음)
have = {os.path.expanduser(d).rstrip('/') for d in dirs}
for m in ('usage-band', 'task-progress-band', 'progress-pane'):
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
echo "   입력창 위 막대: 터미널 = usage-band, 데스크톱 앱 = usage-band 조작 줄 + task-progress-band 막대"
echo "   (VS Code 확장 채팅 패널은 mod 화면 미지원 — VS Code 내장 터미널의 claude 는 usage-band)"
echo "   /progress = 흐름도 패널(메인·Jev·서브에이전트·세션 로그)"

import type { RenderJob } from '../types'

// 렌더로 보는 프로세스 종류 — 순서대로 첫 매칭을 씀
// ponytail: 정규식 휴리스틱, 새 렌더 도구가 생기면 여기 한 줄 추가
const KINDS: [string, RegExp][] = [
  ['hyperframes', /hyperframes\S*\s+render/],
  ['remotion', /remotion\S*\s+render/],
  ['whisper', /(^|\/)whisper(-cli)?\s/],
  ['ffmpeg', /(^|\/)ffmpeg\s/],
  // render.py·render17.py 같은 playwright 프레임 캡처 스크립트 포함
  ['render-script', /(render|capture|frames?)[\w-]*\.(py|mjs|js|ts)\b/],
]

// ps 의 etime([[dd-]hh:]mm:ss)을 초로 변환
export const parseEtime = (etime: string): number => {
  const [days, rest] = etime.includes('-') ? etime.split('-') : ['0', etime]
  const parts = (rest ?? '').split(':').map(Number)
  while (parts.length < 3) parts.unshift(0)
  const [h = 0, m = 0, s = 0] = parts
  return Number(days) * 86400 + h * 3600 + m * 60 + s
}

// 셸 래퍼(zsh -c "…", bash -c "…")는 명령 문자열에 렌더 명령이 들어 있어도 렌더로 치지 않음
const SHELL = /^(\S*\/)?(ba|z|da)?sh\s+(-\w+\s+)*-c\s/

export const classify = (command: string): string | undefined =>
  SHELL.test(command) ? undefined : KINDS.find(([, re]) => re.test(command))?.[0]

// `ps -axo pid=,ppid=,etime=,command=` 출력에서 렌더 프로세스만 추림
// npx 는 npm exec → node …/hyperframes → ffmpeg 처럼 여러 겹으로 뜨므로,
// 조상 중에 이미 렌더로 잡힌 프로세스가 있으면 건너뛰고 맨 위 하나만 남김
export const parsePs = (stdout: string): RenderJob[] => {
  const rows = stdout.split('\n').flatMap(line => {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/)
    if (!m) return []
    const [, pid = '', ppid = '', etime = '', command = ''] = m
    return [{ pid: Number(pid), ppid: Number(ppid), command, seconds: parseEtime(etime), kind: classify(command) }]
  })
  const parent = new Map(rows.map(r => [r.pid, r.ppid]))
  const isJob = new Set(rows.filter(r => r.kind).map(r => r.pid))
  const hasJobAncestor = (pid: number): boolean => {
    // ponytail: 깊이 64 제한으로 순환 방지
    for (let p = parent.get(pid), n = 0; p !== undefined && p > 1 && n < 64; p = parent.get(p), n++) {
      if (isJob.has(p)) return true
    }
    return false
  }
  return rows.flatMap(r =>
    r.kind && !hasJobAncestor(r.pid) ? [{ pid: r.pid, kind: r.kind, command: r.command, seconds: r.seconds }] : [],
  )
}

export const fmt = (sec: number): string => {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`
}

// 같은 종류 과거 소요 시간 평균(최근 10건)
export const average = (list: number[] | undefined): number | undefined =>
  list && list.length > 0 ? list.reduce((a, b) => a + b, 0) / list.length : undefined

// 평균 소요 시간 대비 진행률(%) — 기록 없으면 undefined, 끝나기 전엔 99 에서 멈춤
// ponytail: 실제 진행률이 아니라 과거 평균 기준 추정치
export const percent = (seconds: number, avg: number | undefined): number | undefined =>
  avg === undefined || avg <= 0 ? undefined : Math.min(99, Math.floor((seconds / avg) * 100))

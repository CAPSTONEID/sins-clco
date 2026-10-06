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

export const classify = (command: string): string | undefined =>
  KINDS.find(([, re]) => re.test(command))?.[0]

// `ps -axo pid=,etime=,command=` 출력에서 렌더 프로세스만 추림
export const parsePs = (stdout: string): RenderJob[] =>
  stdout.split('\n').flatMap(line => {
    const m = line.trim().match(/^(\d+)\s+(\S+)\s+(.+)$/)
    if (!m) return []
    const [, pid = '', etime = '', command = ''] = m
    const kind = classify(command)
    if (!kind) return []
    return [{ pid: Number(pid), kind, command, seconds: parseEtime(etime) }]
  })

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

// 진행 탭 흐름도(메인 → 서브에이전트 카드 → 리드 복귀) 그리기용 순수 함수

// 네온 다크 팔레트 — 흐름도 화면은 다크 네이비 바탕에 네온 포인트
export const NEON = {
  bg: '#0b1020', // 바탕
  fg: '#e6e9f5', // 본문 글자
  muted: '#8b95b8', // 보조 글자
  subtle: '#2e3a63', // 쉬는 선·테두리
  warn: '#ff9e64', // split·미달
  cyan: '#00e5ff', // 강조(보는 탭·펼친 내용)
  chip: '#c9d1f0', // 버튼 칩 바탕(어두운 버튼 글자가 보이는 밝은 색)
}
// 모델 계열 색 — opus 네온 보라 · sonnet 네온 주황 · haiku 네온 시안, 그 외 네온 파랑
export const famColor = (model = '') =>
  /opus/i.test(model) ? '#b388ff' : /sonnet/i.test(model) ? '#ff9e64' : /haiku/i.test(model) ? '#00e5ff' : '#4dabff'
// 완료·Jev 초록은 채도를 낮춘 세이지 그린(형광 초록은 눈이 피로함)
export const DONE = '#6fbf95'
export const FAIL = '#ff4d6d'

const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max']
// effort → "▮▮▮▯▯ high" (모르는 값은 그대로, 없으면 '기본')
export const effortBar = (effort?: string | number) => {
  if (effort === undefined) return '기본'
  const n = typeof effort === 'string' ? LEVELS.indexOf(effort) + 1 : 0
  return n ? `${'▮'.repeat(n)}${'▯'.repeat(LEVELS.length - n)} ${effort}` : String(effort)
}

// 토큰 수 → 412k / 1.2M
export const kTok = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1000)}k`)

// mcp__서버__도구 → 도구
export const shortTool = (name: string) => name.replace(/^mcp__.+?__/, '')

// 도구 입력에서 로그 한 줄 요약 — 경로는 파일 이름만, 여러 줄은 첫 줄만
const KEYS = ['file_path', 'notebook_path', 'path', 'pattern', 'command', 'description', 'query', 'url', 'skill', 'prompt']
export const argOf = (input: Record<string, unknown>) => {
  for (const k of KEYS) {
    const v = input[k]
    if (typeof v !== 'string' || !v.trim()) continue
    const s = v.trim().split('\n')[0] ?? ''
    return k.endsWith('path') ? s.split('/').pop() || s : s
  }
  return ''
}

// 시각 → HH:MM:SS (현지 시각)
export const hms = (t: number) => {
  const d = new Date(t)
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(x => String(x).padStart(2, '0')).join(':')
}

// 카드 배치: 한 줄 장수(per)와 카드 너비(cw). 카드 사이 1칸
export const layout = (n: number, total: number, min = 16) => {
  const per = Math.max(1, Math.min(n, Math.floor((total + 1) / (min + 1))))
  return { per, cw: Math.floor((total - (per - 1)) / per) }
}

const centers = (per: number, cw: number) => Array.from({ length: per }, (_, i) => i * (cw + 1) + Math.floor(cw / 2))

// 갈래선 — top: 위에서 내려와 카드마다 갈라짐 "╭──┴──╮", 아래: 카드에서 모여 내려감 "╰──┬──╯"
// 카드 1장이면 가운데 "│"
export const forkLine = (per: number, cw: number, top: boolean) => {
  const total = per * cw + per - 1
  const c = centers(per, cw)
  const mid = Math.floor(total / 2)
  const chars: string[] = Array.from({ length: total }, (_, i) => (per > 1 && i >= c[0]! && i <= c[per - 1]! ? '─' : ' '))
  if (per === 1) {
    chars[c[0]!] = '│'
    return chars.join('')
  }
  c.forEach((x, i) => {
    chars[x] = i === 0 ? (top ? '╭' : '╰') : i === per - 1 ? (top ? '╮' : '╯') : top ? '┬' : '┴'
  })
  chars[mid] = chars[mid] === '─' ? (top ? '┴' : '┬') : '┼'
  return chars.join('')
}

// 카드 가운데마다 같은 글자(기본 ▼)
export const arrows = (per: number, cw: number, glyph = '▼') => {
  const chars = Array.from({ length: per * cw + per - 1 }, () => ' ')
  for (const x of centers(per, cw)) chars[x] = glyph
  return chars.join('')
}

// 카드로 내려가는 화살표 3줄 — 흐를 땐 ▼가 1→2→3번째 줄로 한 칸씩 내려가고 나머지 줄은 선(│) 유지.
// 쉴 땐 위 두 줄은 흐린 점선(┊), 마지막 줄에 흐린 ▼
export const ARROW_ROWS = 3
export const arrowRows = (per: number, cw: number, phase: number, lit: boolean): string[] =>
  Array.from({ length: ARROW_ROWS }, (_, i) =>
    arrows(per, cw, lit ? (phase % ARROW_ROWS === i ? '▼' : '│') : i === ARROW_ROWS - 1 ? '▼' : '┊'),
  )

// 흐름 표시 글자 — 세로선은 아래로 흘러가는 ▼, 가로선은 작은 원 •
export const FLOW = '▼'
export const DOT = '•'

// 가로선 위를 흐르는 • — 가로선('─') 칸 중 가운데 좌우로 하나씩.
// outward: 가운데에서 양 끝(카드 쪽)으로 퍼짐 / 아니면 양 끝에서 가운데로 모임
// 결과는 [글자, 흐름 여부] 조각 목록(이어 붙이면 원래 길이)
export const dots = (line: string, phase: number, outward = true): [string, boolean][] => {
  const chars = [...line]
  const slots = chars.flatMap((ch, i) => (ch === '─' ? [i] : []))
  if (!slots.length) return [[line, false]]
  const mid = Math.floor(chars.length / 2)
  // 가운데에 가까운 칸부터
  const left = slots.filter(i => i < mid).reverse()
  const right = slots.filter(i => i > mid)
  const n = Math.max(left.length, right.length)
  const k = outward ? phase % n : n - 1 - (phase % n)
  const hot = new Set([left[Math.min(k, left.length - 1)], right[Math.min(k, right.length - 1)]].filter((x): x is number => x !== undefined))
  const out: [string, boolean][] = []
  chars.forEach((ch, i) => {
    const isDot = hot.has(i)
    const last = out[out.length - 1]
    if (last && last[1] === isDot && !isDot) last[0] += ch
    else out.push([isDot ? DOT : ch, isDot])
  })
  return out
}

// 실행 중 카드 막대: 3칸 블록이 왼→오로 흐름 / 끝난 카드는 꽉 참
export const cardBar = (w: number, phase: number, state: 'run' | 'done' | 'idle') =>
  Array.from({ length: Math.max(1, w) }, (_, i) =>
    state === 'done' ? true : state === 'run' ? (i - (phase % w) + w) % w < 3 : false,
  )

// 스피너 한 칸
export const spin = (phase: number) => ['◐', '◓', '◑', '◒'][phase % 4]!

// 한 글자 화면 폭 — 한글·한자·전각·이모지는 2칸
const cellW = (ch: string) => (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]|\p{Extended_Pictographic}/u.test(ch) ? 2 : 1)

// 세션 로그 내역: "도구 입력요약" 을 화면 폭 max 칸(최대 LOG_TEXT_MAX)에 맞춰 자르고 … 표시
export const LOG_TEXT_MAX = 28
export const logText = (tool: string, arg: string, max: number) => {
  const text = arg ? `${tool} ${arg}` : tool
  const room = Math.max(4, Math.min(max, LOG_TEXT_MAX))
  let w = 0
  let out = ''
  for (const ch of text) {
    w += cellW(ch)
    if (w > room - 1) return `${out}…`
    out += ch
  }
  return text
}

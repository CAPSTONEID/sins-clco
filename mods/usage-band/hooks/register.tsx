import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Gauge, Modes, ModelInfo, Picker, Snapshot } from '../types'

const snap = atom({ plugin: 'usage-band', key: 'snap' } as const, {} as Snapshot)
// progress-pane 이 쓰는 값을 읽기만 함 (다른 플러그인 값은 읽기 허용, 쓰기는 주인만)
const run = atom({ plugin: 'progress-pane', key: 'run' } as const, null)
const runs = atom({ plugin: 'progress-pane', key: 'runs' } as const, [])
// 단계 줄을 누르면 그 아래에 이 작업의 서브에이전트 목록 펼침
const subsOpen = atom({ plugin: 'usage-band', key: 'subsOpen' } as const, false)
const jobs = atom({ plugin: 'progress-pane', key: 'jobs' } as const, [])
// 옆 칸 표시 여부: 옵션 기본값 위에 /usage-band 로 정한 값($.store)이 우선
const beside = atom({ plugin: 'usage-band', key: 'beside' } as const, true)
const agents = atom({ plugin: 'progress-pane', key: 'agents' } as const, [])
// 종류별 과거 렌더 소요 시간(초) — 진행률(%) 추정용
// 단계 목록(progress-pane steps 도구) — 세션이 끝나도 유지, [×] 로 비움
const stepList = atom({ plugin: 'progress-pane', key: 'steps' } as const, [])
const renderHistory = atom({ plugin: 'progress-pane', key: 'renderHistory' } as const, {})
const model = atom({ plugin: 'usage-band', key: 'model' } as const, {} as ModelInfo)
// caveman 은 SessionStart hook 이 매 세션 full 로 주입하므로 기본 켜짐
const modes = atom({ plugin: 'usage-band', key: 'modes' } as const, { caveman: 'full', humanize: '기본' } as Modes)

// ponytail 플러그인이 쓰는 모드 파일(~/.claude/.ponytail-active). 없거나 비면 꺼짐 (ponytail readMode 와 같은 규칙)
const ponytailFile = ($: EngineInterface) => `${$.plugin.root}/../../.ponytail-active`
async function readPonytail($: EngineInterface): Promise<string | undefined> {
  const text = await $.fs.read(ponytailFile($)).catch(() => undefined)
  return text?.trim() || undefined
}

// humanize-korean 윤문 강도 3단계 (스킬의 `강도: 보수|기본|적극`)
export const HZ_LEVELS = ['보수', '기본', '적극'] as const
// 파일 값 → 강도: 'off' = 꺼짐, 세 강도 중 하나면 그대로, 그 외(없음·예전 'on')는 기본
export const humanizeOf = (text?: string): string | undefined => {
  const t = text?.trim()
  return t === 'off' ? undefined : HZ_LEVELS.includes(t as (typeof HZ_LEVELS)[number]) ? t : '기본'
}
// CLI 밴드 표시 이름 (파일·모델 안내 값은 보수·기본·적극 그대로)
export const HZ_CLI: Record<string, string> = { 보수: 'low', 기본: 'mid', 적극: 'high' }
// 이름 누를 때마다 OFF → 보수 → 기본 → 적극 → OFF
export const nextHumanize = (mode?: string): string | undefined => {
  const i = mode === undefined ? -1 : HZ_LEVELS.indexOf(mode as (typeof HZ_LEVELS)[number])
  return HZ_LEVELS[i + 1]
}

// humanize-korean 검수 상태 파일(~/.claude/.humanize-review). 세션이 바뀌어도 유지
const humanizeFile = ($: EngineInterface) => `${$.plugin.root}/../../.humanize-review`
async function readHumanize($: EngineInterface): Promise<string | undefined> {
  return humanizeOf(await $.fs.read(humanizeFile($)).catch(() => undefined))
}

// 검수 상태 저장: 표시 갱신 → 파일 기록 → 다음 입력에 모델 안내
async function setHumanize($: EngineInterface, to?: string): Promise<void> {
  await update($, modes, x => ({ ...x, humanize: to }))
  await $.fs.write(humanizeFile($), to ?? 'off')
  pending.add('humanize')
}

// 이름을 눌러 바꾼 모드: 다음 입력에 모델이 읽을 안내를 붙임
// ponytail: 모듈 변수라 mod 재로드 시 미전달 안내는 사라짐, 바뀐 표시·파일은 남음
const pending = new Set<'ponytail' | 'caveman' | 'humanize'>()

// 입력 → caveman 모드: 강도 문자열 = 켜짐, undefined = 꺼짐, null = 변화 없음
export const cavemanFrom = (text: string, command?: { name: string; args: string }): string | undefined | null => {
  const t = text.trim().toLowerCase()
  const arg = (command?.args ?? '').trim().toLowerCase()
  if (command?.name === 'caveman') return arg === 'off' ? undefined : arg || 'full'
  return t === 'stop caveman' || t === 'normal mode' ? undefined : null
}

// 모드 강도 3단계 (caveman wenyan-* 도 뒤 강도로 칸 수를 셈, wenyan 단독은 full). -1 = 강도 아님
const LEVELS = ['lite', 'full', 'ultra'] as const
// 이름 누를 때마다 OFF → LITE → FULL → ULTRA → OFF
export const nextMode = (mode?: string): string | undefined => {
  if (mode === undefined) return LEVELS[0]
  const lv = levelOf(mode)
  return lv >= LEVELS.length - 1 ? undefined : LEVELS[lv + 1]
}

// 바뀐 모드를 모델에 알리는 안내 한 줄
export const modeNote = (which: 'ponytail' | 'caveman' | 'humanize', mode?: string) =>
  which === 'humanize'
    ? `HUMANIZE REVIEW: ${mode ? `ON — 강도: ${mode}` : 'OFF'} — follow the CLAUDE.md "한글 결과물 검수" rule from now on.`
    : which === 'ponytail'
    ? mode
      ? `PONYTAIL MODE CHANGED — level: ${mode}. Apply the ponytail ${mode} rules from now on.`
      : 'PONYTAIL MODE OFF — stop applying ponytail rules from now on.'
    : mode
      ? `CAVEMAN MODE CHANGED — level: ${mode}. Apply the caveman ${mode} rules (~/.claude/skills/caveman/SKILL.md) from now on.`
      : 'CAVEMAN MODE OFF — reply in normal style from now on.'

export const levelOf = (mode: string) =>
  LEVELS.indexOf((mode.replace(/^wenyan-?/, '') || 'full') as (typeof LEVELS)[number])

// Model·Effort 선택 줄
const picker = atom({ plugin: 'usage-band', key: 'picker' } as const, null as Picker)
// herdr 자식 터미널 (hc ls 의 parent = 이 세션 터미널, 살아 있고 done 아님)
// ponytail: `claude` 로 띄운 터미널은 hc 가 status 를 안 줘서(작업 중·대기 구분 불가) 살아 있으면 표시, 끝나면 hc kill 로 정리
// Subagents 칸 개수: 실행 중 + hc 는 완료 전까지 (claude 로 띄운 hc 터미널은 상태를 안 줄 때가 있어 대기·작업 구분 불가)
export const busyCount = (list: readonly { type: string; status: string }[]) =>
  list.filter(a => a.status === 'running' || (a.type === 'hc' && a.status !== 'completed')).length

// 단계 줄이 보여 주는 작업에서 띄운 서브에이전트 중 아직 살아 있는 것
// since(단계 목록 첫 시작 시각)가 있으면 그 뒤로 이어진 작업 전부, 없으면(자동 1단계) 지금 작업, 없으면 마지막 완료 작업
type RunSubs = { subs?: string[]; endedAt?: number }
export const taskSubs = <A extends { id: string }>(cur: RunSubs | null, past: readonly RunSubs[], list: readonly A[], since?: number): A[] => {
  const from = since === undefined ? [cur ?? past[0]] : [cur, ...past.filter(x => (x.endedAt ?? Infinity) >= since)]
  const ids = new Set(from.flatMap(x => x?.subs ?? []))
  return list.filter(a => ids.has(a.id))
}

// 선택지: /model 별칭 → 표시 이름 (별칭이라 새 버전이 나와도 최신으로 감)
export const MODELS = [
  { alias: 'fable', label: 'Fable 5.2' },
  { alias: 'opus', label: 'Opus 5.5' },
  { alias: 'sonnet', label: 'Sonnet 5.5' },
  { alias: 'haiku', label: 'Haiku 5.5' },
] as const

// 선택 → /model·/effort 를 사람이 친 것처럼 실행(작업 중이면 끝난 뒤 적용) + 표시 먼저 갱신
async function pick($: EngineInterface, kind: 'model' | 'effort' | 'advisor', value: string, label: string): Promise<void> {
  await update($, picker, () => null)
  await update($, model, m =>
    kind === 'model' ? { ...m, name: label } : kind === 'effort' ? { ...m, effort: value } : { ...m, advisor: value === 'off' ? undefined : value },
  )
  $.ui.toast(`${kind[0]!.toUpperCase() + kind.slice(1)} → ${label} · 작업 중이면 끝난 뒤 적용`)
  await $.command.run({ command: kind, args: value })
}

// 어드바이저 선택지 (/advisor <모델>|off) — 더 강한 모델만
export const ADVISORS = [
  { alias: 'fable', label: 'Fable 5.2' },
  { alias: 'opus', label: 'Opus 5.5' },
  { alias: 'off', label: 'OFF' },
] as const

// settings.json 의 advisorModel (없으면 꺼짐)
async function readAdvisor($: EngineInterface): Promise<string | undefined> {
  const text = await $.fs.read(`${$.plugin.root}/../../settings.json`).catch(() => undefined)
  try {
    const v = text ? (JSON.parse(text) as { advisorModel?: unknown }).advisorModel : undefined
    return typeof v === 'string' && v ? v : undefined
  } catch {
    return undefined
  }
}

// 추론 단계 순서 (단계 표시용)
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const

// 모델 id → 표시 이름: claude-opus-5-5 → Opus 5.5, claude-haiku-4-5-20251001 → Haiku 4.5
export const prettyModel = (id: string) => {
  // 빈 세그먼트(claude--opus 등)는 버림: p[0] 이 undefined 라 toUpperCase 에서 던지는 것 방지
  const parts = id.replace(/\[.*\]$/, '').replace(/^claude-/, '').split('-').filter(p => p && !/^\d{8}$/.test(p))
  const name = parts.filter(p => !/^\d+$/.test(p)).map(p => p[0]!.toUpperCase() + p.slice(1)).join(' ')
  const ver = parts.filter(p => /^\d+$/.test(p)).join('.')
  return [name || id, ver].filter(Boolean).join(' ')
}

// 게이지 막대 칸 수 (25/50/75% 눈금 포함)
const BAR_WIDE = 32

// 행별 그라데이션 시작·끝 색 (이미지 시안 기준)
const ROWS = [
  { key: 'context', label: '컨텍스트', dot: '#1fb5c9', from: [31, 181, 201], to: [37, 99, 235] },
  { key: 'fiveHour', label: '5시간 한도', dot: '#3b6cf6', from: [59, 108, 246], to: [79, 70, 229] },
  { key: 'sevenDay', label: '7일 한도', dot: '#5b4ff0', from: [79, 70, 229], to: [168, 85, 247] },
] as const

// 2열 모드: 게이지 막대를 줄여 오른쪽 작업 칸에 자리를 줌
// 좁은 막대 폭 / 게이지 열 너비(라벨 14 + 막대 + 퍼센트 6 + 설명 22) / 작업 칸 최소 너비
const BAR_NARROW = 16
const GAUGE_W = 13 + BAR_NARROW + 2 + 6 + 22
const SIDE_MIN = 24
// 데스크톱 옆 칸 라벨 폭(칸): 버튼 여백까지 넣어 'Render bar' 가 잘리지 않는 최소 폭 (값 칸과 간격 최소)
const DESK_LABEL_W = 11

// 경과 시간 → "2분 14초", 렌더 시간 → "1:23"
const dur = (ms: number) => {
  const sec = Math.max(0, Math.floor(ms / 1000))
  return sec >= 60 ? `${Math.floor(sec / 60)}분 ${sec % 60}초` : `${sec}초`
}
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

// 같은 종류 과거 평균 대비 진행률 — 기록 없으면 undefined, 끝나기 전엔 99 에서 멈춤
// ponytail: progress-pane render.ts 의 average·percent 와 같은 계산(플러그인 간 import 불가라 복제)
export const renderPct = (seconds: number, past: number[] | undefined) => {
  const avg = past?.length ? past.reduce((a, b) => a + b, 0) / past.length : 0
  return avg > 0 ? Math.min(99, Math.floor((seconds * 100) / avg)) : undefined
}

// 터미널 칸 수: 한글·CJK 는 2칸
const cells = (s: string) => [...s].reduce((n, c) => n + (c.codePointAt(0)! >= 0x1100 ? 2 : 1), 0)
// cap 칸을 넘으면 잘라서 … 붙임
const cut = (s: string, cap: number) => {
  if (cells(s) <= cap) return s
  let out = ''
  for (const c of s) {
    if (cells(out + c) > cap - 1) break
    out += c
  }
  return out + '…'
}

// 단계 줄(가로 1줄): width 칸에 맞게 이름을 줄이고, 그래도 넘치면 진행 중 단계 주변만 남김
// 한 단계 = 아이콘·공백 2칸 + 이름, 단계 사이 ' । ' 3칸, 앞뒤 생략 표시 2칸
type Step = { subject: string; status: string; startedAt?: number; endedAt?: number }
export const fitSteps = (tasks: readonly Step[], width: number) => {
  const size = (list: readonly Step[], cap: number) =>
    // 아래 줄 소요시간('  10분 59초' = 11칸)보다 좁아지지 않게 항목 폭을 잡음
    list.reduce((n, t) => n + Math.max(2 + cells(cut(t.subject, cap)), t.startedAt === undefined ? 0 : 11), 0) + 3 * Math.max(0, list.length - 1)
  const pick = (list: readonly Step[], cap: number) =>
    list.map(t => ({ text: cut(t.subject, cap), status: t.status, startedAt: t.startedAt, endedAt: t.endedAt }))
  for (const cap of [20, 14, 10]) {
    if (size(tasks, cap) <= width) return { items: pick(tasks, cap), before: false, after: false }
  }
  const cap = 10
  const at = Math.max(0, [tasks.findIndex(t => t.status === 'in_progress'), tasks.findIndex(t => t.status === 'pending'), tasks.length - 1].find(i => i >= 0) ?? 0)
  let lo = at
  let hi = at
  const fits = (a: number, b: number) => size(tasks.slice(a, b + 1), cap) + (a > 0 ? 2 : 0) + (b < tasks.length - 1 ? 2 : 0) <= width
  // 앞(완료) 1개, 뒤(남은) 1개씩 번갈아 넓힘
  for (let grew = true; grew; ) {
    grew = false
    if (lo > 0 && fits(lo - 1, hi)) (lo--, (grew = true))
    if (hi < tasks.length - 1 && fits(lo, hi + 1)) (hi++, (grew = true))
  }
  return { items: pick(tasks.slice(lo, hi + 1), cap), before: lo > 0, after: hi < tasks.length - 1 }
}

// 토큰 수를 349K / 1.0M 형태로
const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}K`)

// 두 RGB 사이 보간 → hex
const mix = (a: readonly number[], b: readonly number[], t: number) =>
  '#' + a.map((v, i) => Math.round(v + ((b[i] ?? v) - v) * t).toString(16).padStart(2, '0')).join('')

// 초기화까지 남은 시간 → "1일 19시간" / "4시간 46분"
export const until = (iso: string | undefined, now: number) => {
  // 파싱 실패(잘못된 날짜 문자열 등)면 NaN분 대신 빈 문자열
  const t = iso ? Date.parse(iso) : NaN
  if (!Number.isFinite(t)) return ''
  const min = Math.max(0, Math.round((t - now) / 60000))
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  return (d ? `${d}일 ${h}시간` : h ? `${h}시간 ${m}분` : `${m}분`) + ' 후 초기화'
}

// 엔진 수치 → 스냅샷
const toSnap = (context: SessionContextUsage, limits: SessionRateLimit[]): Snapshot => {
  const lim = (kind: string): Gauge | undefined => {
    const r = limits.find(l => l.kind === kind)
    return r && { percent: r.percentUsed, detail: '', resetsAt: r.resetsAt }
  }
  return {
    context:
      context.percent === undefined
        ? undefined
        : { percent: context.percent, detail: `${fmt(context.tokens ?? 0)} / ${fmt(context.window)} 토큰` },
    fiveHour: lim('five_hour'),
    sevenDay: lim('seven_day'),
  }
}

// ponytail: task-progress-band 의 게이지 막대와 같은 함수·크기. 플러그인끼리 import 못 해 복사함 (바꿀 땐 둘 다)
// 데스크톱용 둥근 막대: 반투명 트랙이라 라이트·다크 테마 모두에서 보인다
// 채운 구간 = 가로 그라디언트 + 위쪽 광택 + 점무늬 질감, 끝에 은은한 빛번짐
// 막대 크기(CSS px): 짧고 두껍게. Svg 에 그대로 넘겨 늘어나거나 납작해지지 않게 함
const BAR_W = 120
const BAR_H = 10
const barSvg = (pct: number, [from, to]: readonly [string, string], ticks: number) => {
  const W = BAR_W
  const H = BAR_H
  const fill = pct <= 0 ? 0 : Math.max(H, Math.round((Math.min(pct, 100) / 100) * W))
  const marks = Array.from({ length: Math.max(0, ticks - 1) }, (_, i) => Math.round(((i + 1) / ticks) * W))
    .map(x => `<rect x="${x - 0.75}" y="3" width="1.5" height="${H - 6}" rx="0.75" fill="${x < fill ? '#ffffff' : '#8e8e99'}" fill-opacity="${x < fill ? 0.8 : 0.5}"/>`)
    .join('')
  const glow = fill > 0 ? `<circle cx="${fill - H / 2}" cy="${H / 2}" r="${H}" fill="url(#r)"/>` : ''

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><clipPath id="c"><rect width="${W}" height="${H}" rx="${H / 2}"/></clipPath>` +
    `<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${Math.max(fill, 1)}" y2="0"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>` +
    `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="r"><stop offset="0" stop-color="${to}" stop-opacity="0.9"/><stop offset="1" stop-color="${to}" stop-opacity="0"/></radialGradient>` +
    `<pattern id="d" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.8" fill="#ffffff" fill-opacity="0.25"/></pattern></defs>` +
    `<g clip-path="url(#c)"><rect width="${W}" height="${H}" fill="#8e8e99" fill-opacity="0.22"/>` +
    `<rect width="${fill}" height="${H}" fill="url(#g)"/>${glow}<rect width="${fill}" height="${H}" fill="url(#s)"/>` +
    `<rect width="${fill}" height="${H}" fill="url(#d)"/>${marks}</g></svg>`
  )
}

// 단계 막대(데스크톱): n칸 중 lv칸을 채움. 게이지 막대와 같은 모양(둥근 반투명 칸 + 가로 그라디언트 + 광택 + 점무늬)
const SEG_W = 20
const SEG_GAP = 4
const hex = (c: readonly number[]) => `#${c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`
export const segSvg = (n: number, lv: number, [from, to]: readonly [string, string]) => {
  const H = BAR_H
  const W = n * SEG_W + (n - 1) * SEG_GAP
  const cell = (i: number) => `<rect x="${i * (SEG_W + SEG_GAP)}" width="${SEG_W}" height="${H}" rx="${H / 2}"/>`
  const cells = Array.from({ length: n }, (_, i) => i)
  const on = cells.filter(i => i < lv)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><clipPath id="f">${on.map(cell).join('')}</clipPath>` +
    `<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>` +
    `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<pattern id="d" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.8" fill="#ffffff" fill-opacity="0.25"/></pattern></defs>` +
    `<g fill="#8e8e99" fill-opacity="0.22">${cells.filter(i => i >= lv).map(cell).join('')}</g>` +
    (on.length ? `<g clip-path="url(#f)"><rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#s)"/><rect width="${W}" height="${H}" fill="url(#d)"/></g>` : '') +
    `</svg>`
  )
}

export const register: Register = (on, options) => {

  // 시작 시 1회 읽기 (resume 세션이면 바로 값이 있음)
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await $.command.register({ name: 'usage-band', description: '게이지 옆 작업·렌더 칸 켜기/끄기 (on|off, 인자 없으면 전환)' })
    // 저장된 값(/usage-band) > userConfig progressBeside > 기본 켜짐
    const saved = await $.store.get('beside')
    await update($, beside, () => (typeof saved === 'boolean' ? saved : options.progressBeside !== false))
    const u = await $.session.usage()
    await update($, snap, () => toSnap(u.context, u.rateLimits))
    const id = await $.session.model()
    const adv = await readAdvisor($)
    await update($, model, m => ({ ...m, name: prettyModel(id), advisor: adv }))
    const pt = await readPonytail($)
    const hz = await readHumanize($)
    await update($, modes, x => ({ ...x, ponytail: pt, humanize: hz }))
    await $.command.register({ name: 'humanize-review', description: '한글 결과물 humanize-korean 검수 (off|보수|기본|적극, on=기본, 인자 없으면 다음 단계)' })
    // 1분마다 다시 읽어 그림 → 턴 사이에도 "N분 후 초기화" 카운트다운이 흐름
    // ponytail: 한도 값은 이 세션의 API 응답 기준, 다른 세션(하이퍼프레임 등) 사용분은 이 세션이 다음 요청을 보내야 반영
    $.clock.every(60_000, async () => {
      const u = await $.session.usage()
      await update($, snap, () => toSnap(u.context, u.rateLimits))
      // 데스크톱 하단 모델 선택처럼 턴 없이 바뀐 모델도 1분 안에 반영
      const name = prettyModel(await $.session.model())
      await update($, model, m => (m.name === name ? m : { ...m, name }))
    })
    return r
  })

  on('command.run', { command: 'humanize-review' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const to = arg === 'off' ? undefined : arg === 'on' ? '기본' : arg ? humanizeOf(arg) : nextHumanize((await read($, modes)).humanize)
    await setHumanize($, to)
    return { text: `한글 결과물 검수(humanize-korean): ${to ? `ON · 강도 ${to}` : 'OFF'} · 다음 입력부터 적용` }
  })

  on('command.run', { command: 'usage-band' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const cur = await read($, beside)
    const next = arg === 'on' ? true : arg === 'off' ? false : !cur
    await $.store.set('beside', next)
    await update($, beside, () => next)
    return { text: `작업·렌더 옆 칸: ${next ? '켜짐' : '꺼짐'}` }
  })

  // /caveman·/ponytail·"stop caveman"·"normal mode" 입력을 따라 배지 갱신
  on('prompt.submit', async ($, e, next) => {
    let notes: string[] = []
    if (pending.size > 0) {
      const md = await read($, modes)
      notes = [...pending].map(w => (w === 'humanize' ? modeNote(w, md.humanize) : modeNote(w, md[w])))
      pending.clear()
    }
    const r = await next(notes.length ? { ...e, context: [...(e.context ?? []), ...notes] } : e)
    const cave = cavemanFrom(e.text, e.command)
    // ponytail 은 자기 hook 이 파일을 먼저 고치므로 다시 읽기만 함
    const pt = await readPonytail($)
    // humanize 도 파일이 기준: 다른 세션에서 바꿨거나 시작 때 못 읽었어도 표시가 파일(=모델이 받는 상태)을 따라감
    const hz = await readHumanize($)
    // 배지 갱신 실패가 입력 처리를 막지 않게 오류는 버림
    await update($, modes, x => {
      const caveman = cave === null ? x.caveman : cave
      return x.caveman === caveman && x.ponytail === pt && x.humanize === hz ? x : { ...x, caveman, ponytail: pt, humanize: hz }
    }).catch(() => undefined)
    return r
  })

  // 메인 루프 요청마다 실제 모델·추론 단계 반영 (서브에이전트 제외)
  on('turn.step', async function* ($, e, next) {
    if (!e.agentId) {
      const name = prettyModel(e.model)
      await update($, model, m => (m.name === name && m.effort === e.effort ? m : { name, effort: e.effort }))
    }
    return yield* next(e)
  })

  // 턴 종료·한도 변동 시 엔진이 밀어주는 값으로 갱신
  on('session.measure', async ($, e, next) => {
    await update($, snap, () => toSnap(e.context, e.rateLimits))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, snap)
    const m = await read($, model)
    // 터미널: 전체 밴드. 데스크톱 앱: 모드·Model·Effort·Advisor 조작 줄만 그리고, 단계·게이지 막대는 아래 task-progress-band 몫
    // VS Code 확장 채팅 패널은 mod 화면을 그리지 않음 (VS Code 내장 터미널의 claude 는 usage-band)
    const isDesk = e.surface === 'desktop'
    if ((e.surface !== 'terminal' && !isDesk) || e.props.hasSurvey) return next(e)
    if (!isDesk && !ROWS.some(r => s[r.key]) && !m.name) return next(e)
    // 추론 단계 위치 (1~5), 문자열 아닌 숫자 effort 면 -1
    const lvl = typeof m.effort === 'string' ? EFFORTS.indexOf(m.effort as (typeof EFFORTS)[number]) : -1

    const now = await $.clock.now()
    const md = await read($, modes)
    const pk = await read($, picker)
    const toggle = (k: 'model' | 'effort' | 'advisor') => void update($, picker, x => (x === k ? null : k)).catch(() => undefined)
    // 이름 클릭: 표시 갱신 → ponytail 은 모드 파일도 고침 → 다음 입력에 모델 안내
    const cycle = async (which: 'ponytail' | 'caveman') => {
      const to = nextMode((await read($, modes))[which])
      await update($, modes, x => ({ ...x, [which]: to }))
      if (which === 'ponytail') await $.fs.write(ponytailFile($), to ?? '')
      pending.add(which)
      $.ui.toast(`${which === 'ponytail' ? 'Ponytail' : 'Caveman'} → ${to ? to.toUpperCase() : 'OFF'} · 다음 입력부터 적용`)
    }
    const table = $.ui.resolve(e)
    const { Box, Text, Button } = table
    // 데스크톱은 Svg 가 있음: Render bar 를 게이지 막대와 같은 그림으로
    const Svg = isDesk && 'Svg' in table ? table.Svg : undefined
    // 데스크톱: ON/FULL 같은 글자 대신 단계 막대 (alt 에 이름·값)
    const seg = (n: number, lv: number, grad: readonly [string, string], alt: string) =>
      Svg ? <Svg source={segSvg(n, lv, grad)} width={n * SEG_W + (n - 1) * SEG_GAP} height={BAR_H} alt={alt} /> : null
    // 옆 칸: 렌더·서브에이전트 1줄 (작업 진행은 단계 줄이 보여 줌). 터미널이 좁으면 생략
    const isBeside = await read($, beside)
    const r = await read($, run)
    const list = isBeside ? await read($, jobs) : []
    const isSide = isBeside && e.props.bodyColumns >= GAUGE_W + SIDE_MIN + 6
    const BAR = isSide ? BAR_NARROW : BAR_WIDE
    // 단계 줄: 단계 목록이 있으면 그것, 없으면 지금 작업을 1단계로 자동 표시 (모델 도구 호출 없이)
    const sent = await read($, stepList)
    const tasks: Step[] = sent.length
      ? sent
      : r
        ? [{
            subject: r.label ?? (r.prompt.trim().split('\n')[0] ?? '작업').slice(0, 10),
            status: r.endedAt ? 'completed' : 'in_progress',
            startedAt: r.startedAt,
            ...(r.endedAt && { endedAt: r.endedAt }),
          }]
        : []
    const since = sent.length ? Math.min(...sent.map(t => t.startedAt ?? Infinity)) : undefined
    const mine = taskSubs(r, await read($, runs), await read($, agents), since === Infinity ? undefined : since)
    const isSubsOpen = mine.length > 0 && (await read($, subsOpen))
    // 서브에이전트가 있으면 개수 옆 ▾(접힘)·▴(펼침)
    const count = `  ${tasks.filter(t => t.status === 'completed').length}/${tasks.length}${mine.length ? (isSubsOpen ? ' ▴' : ' ▾') : ''}`
    const pressSteps = () =>
      void (mine.length
        ? update($, subsOpen, x => !x)
        : Promise.resolve($.ui.toast('이 작업에서 띄운 서브에이전트가 없거나 모두 닫혔습니다'))
      ).catch(() => undefined)
    // 전체 소요시간: 첫 시작부터 (모두 끝났으면 마지막 완료까지, 아니면 지금까지)
    const starts = tasks.flatMap(t => (t.startedAt === undefined ? [] : [t.startedAt]))
    const isAllDone = tasks.length > 0 && tasks.every(t => t.status === 'completed')
    const ends = tasks.flatMap(t => (t.endedAt === undefined ? [] : [t.endedAt]))
    const stepTotal = starts.length ? (isAllDone && ends.length ? Math.max(...ends) : now) - Math.min(...starts) : undefined
    const fit = fitSteps(tasks, e.props.bodyColumns - 1 - cells(count) - 4)
    // 일하는 서브에이전트 수 (Agent 도구 + herdr hc, 목록은 진행 창에서)
    const busy = isBeside ? busyCount(await read($, agents)) : 0
    const SEP = ' ।। '
    const past = list.length ? await read($, renderHistory) : {}
    // 렌더 시간 ‣ 진행률: "hyperframes 8:59 ‣ 42%" (기록 없으면 시간만)
    const renders = list.map(j => {
      const pct = renderPct(j.seconds, past[j.kind])
      return `${j.kind} ${clock(j.seconds)}${pct === undefined ? '' : ` ‣ ${pct}%`}`
    })
    const firstPct = list[0] ? renderPct(list[0].seconds, past[list[0].kind]) : undefined
    // 옆 칸 4줄 (Model + 게이지 3줄과 높이 맞춤): Advisor · Subagents · Render · Render bar
    const sideW = Math.max(SIDE_MIN, e.props.bodyColumns - GAUGE_W - 9)
    const RBAR = Math.max(8, Math.min(24, sideW - 12 - 6))
    const label = (t: string) => (
      <Box width={isDesk ? DESK_LABEL_W : 12} flexShrink={0}>
        {/* 데스크톱: 동작 없는 버튼으로 Advisor 버튼과 같은 여백을 받아 글자 시작점을 맞춤 (버튼 글자색은 앱이 무시해 흐리게만) */}
        {isDesk ? (
          <Button plain dimColor key={`label-${t}`} label={t} onPress={() => undefined} />
        ) : (
          <Text dimColor>{t}</Text>
        )}
      </Box>
    )
    const advisorName = m.advisor ? (ADVISORS.find(o => o.alias === m.advisor)?.label ?? m.advisor) : undefined
    const side = [
      <Box key="s0" flexDirection="row" alignItems="center">
        {/* 이름(타이틀) 클릭: 어드바이저 선택 줄 (Fable·Opus·OFF) */}
        <Box width={isDesk ? DESK_LABEL_W : 12} flexShrink={0}>
          <Button plain key="pick-advisor" label="Advisor" onPress={() => toggle('advisor')} />
        </Box>
        {advisorName ? <Text bold color="#d97757">{advisorName}</Text> : <Text dimColor>off</Text>}
      </Box>,
      <Box key="s1" flexDirection="row">
        {label('Subagents')}
        {/* 개수만 (목록은 단계 줄을 눌러 펼침) */}
        {busy === 0 ? <Text dimColor>is resting</Text> : <Text color="blue">{`${busy} running`}</Text>}
      </Box>,
      <Box key="s2" flexDirection="row">
        {label('Render')}
        {renders.length ? <Text color="blue" wrap="truncate">{renders.join(SEP)}</Text> : <Text dimColor>none</Text>}
      </Box>,
      <Box key="s3" flexDirection="row" alignItems="center">
        {label('Render bar')}
        {Svg ? (
          <Svg
            source={barSvg(firstPct ?? 0, ['#3b6cf6', '#a855f7'], 4)}
            width={BAR_W}
            height={BAR_H}
            alt={`Render bar ${firstPct === undefined ? '-' : `${firstPct}%`}`}
          />
        ) : Array.from({ length: RBAR }, (_, i) => {
          const filled = firstPct === undefined ? 0 : Math.round((firstPct / 100) * RBAR)
          return i < filled ? (
            <Text key={`r${i}`} color={mix([59, 108, 246], [168, 85, 247], i / RBAR)}>█</Text>
          ) : (
            <Text key={`r${i}`} dimColor>░</Text>
          )
        })}
        <Text bold>{firstPct === undefined ? (list.length ? '   …' : '  - ') : `${firstPct}%`.padStart(4)}</Text>
      </Box>,
    ]

    // 단계 줄(터미널·데스크톱 공용)
    const stepsRow = (
tasks.length > 0 && (
          // 가로 1줄, ' । ' 로 구분: 완료 ✔ 흐리게 · 진행 중 ◐ 청록 굵게 · 대기 ◌
          // 각 항목 아래 줄: 소요시간(완료 = 걸린 시간, 진행 중 = 지금까지), 개수 아래: 전체 소요시간
          <Box flexDirection="row" marginBottom={1}>
            {fit.before && <Text dimColor>… </Text>}
            {fit.items.flatMap((it, i) => [
              ...(i > 0 ? [<Text key={`l${i}`} dimColor>{' । '}</Text>] : []),
              <Box key={`t${i}`} flexDirection="column">
                {/* 단계 이름을 누르면 이 작업의 서브에이전트 목록 펼치기·접기 */}
                <Button key={`step-${i}`} plain onPress={pressSteps}>
                  {/* 데스크톱은 컬러 이모지(✅ 완료 · ▶️ 진행 중), 터미널은 기존 글리프 */}
                  {it.status === 'completed' ? (
                    <Text dimColor>{`${isDesk ? '✅' : '✔'} ${it.text}`}</Text>
                  ) : it.status === 'in_progress' ? (
                    <Text bold color="#1fb5c9">{`${isDesk ? '▶️' : '◐'} ${it.text}`}</Text>
                  ) : (
                    <Text>{`◌ ${it.text}`}</Text>
                  )}
                </Button>
                <Text dimColor color={it.status === 'in_progress' ? '#1fb5c9' : undefined}>
                  {it.startedAt === undefined ? ' ' : `  ${dur((it.endedAt ?? now) - it.startedAt)}`}
                </Text>
              </Box>,
            ])}
            {fit.after && <Text dimColor> …</Text>}
            <Box flexDirection="column">
              <Button key="step-count" plain onPress={pressSteps}>
                <Text bold>{count}</Text>
              </Button>
              <Text dimColor>{stepTotal === undefined ? ' ' : `  총 ${dur(stepTotal)}`}</Text>
            </Box>
          </Box>
        )
    )

    // 터미널·데스크톱 공용 조각: 모드 줄 · Model/Effort/Advisor 선택 줄 · Effort 칸
    // 데스크톱은 모드 줄 바로 아래에 Model 줄을 붙임 (빈 줄 없음)
    // 터미널: 글자를 가로 Box 에 그대로(찾기·테스트용 개별 Text 유지). 데스크톱: 글자 하나로 묶어 한 덩어리로 정렬
    const stateWrap = (children: unknown) =>
      isDesk ? <Text>{children as never}</Text> : <Box flexDirection="row">{children as never}</Box>
    const modesRow = (
        <Box flexDirection="row" flexWrap="wrap" marginBottom={isDesk ? 0 : 1}>
          {([
            ['ponytail', 'Ponytail', md.ponytail, '#87af87', [135, 175, 135], [95, 175, 95]],
            ['caveman', 'Caveman', md.caveman, '#d7875f', [215, 135, 95], [215, 95, 0]],
          ] as const).flatMap(([key, name, mode, dot, from, to], k) => {
            const lv = mode === undefined ? -1 : levelOf(mode)
            // 상태 한 덩어리: ON/OFF + 강도 칸
            const state = Svg && !(mode !== undefined && lv < 0)
              ? seg(LEVELS.length, lv + 1, [hex(from), hex(to)], `${name} ${mode ?? 'off'}`)
              : stateWrap([
              mode === undefined ? <Text key="o" dimColor>OFF </Text> : <Text key="o" bold color={dot}>ON </Text>,
              ...(mode !== undefined && lv < 0
                ? [<Text key="n" bold>{mode.toUpperCase()}</Text>]
                : LEVELS.map((_, i) => (
                    <Text key={`m${i}`} color={i <= lv ? mix(from, to, i / 2) : undefined} dimColor={i > lv}>
                      {i <= lv ? '■' : '□'}
                    </Text>
                  ))),
              ...(mode !== undefined && lv >= 0
                ? [<Text key="l" bold>{` ${mode.toUpperCase()}`}</Text>, <Text key="c" dimColor>{` (${lv + 1}/${LEVELS.length})`}</Text>]
                : []),
            ])
            // 이름(타이틀)을 누르면 다음 강도로 (OFF → LITE → FULL → ULTRA → OFF)
            const press = () => void cycle(key).catch(() => undefined)
            return [
              ...(k > 0 ? [<Text key={`ml${k}`} dimColor>{' । '}</Text>] : []),
              <Box key={name} flexDirection="row" alignItems="center">
                {isDesk
                  ? [
                      // 데스크톱 버튼은 안의 글자색을 무시함: ● 은 버튼 밖 색 글자, 타이틀은 버튼(누르면 변경)
                      <Text key="d" color={dot}>●</Text>,
                      <Button key={`mode-${key}`} plain label={name} onPress={press} />,
                      <Box key="st">{state}</Box>,
                    ]
                  : [
                      <Text key="d" color={dot}>● </Text>,
                      <Button plain key={`mode-${key}`} label={name} onPress={press} />,
                      <Text key="s"> </Text>,
                      <Box key="st">{state}</Box>,
                    ]}
              </Box>,
            ]
          })}
          <Text dimColor>{' । '}</Text>
          {(() => {
            // Humanize: ON/OFF + 윤문 강도 칸, 누르면 OFF → 보수 → 기본 → 적극 → OFF (CLI 표시는 off·low·mid·high)
            const hz = HZ_LEVELS.indexOf(md.humanize as (typeof HZ_LEVELS)[number])
            const lvH = md.humanize === undefined ? -1 : hz
            const state = Svg
              ? seg(HZ_LEVELS.length, lvH + 1, ['#5fafd7', '#2563eb'], `Humanize ${md.humanize ?? 'off'}`)
              : stateWrap([
              md.humanize === undefined ? <Text key="o" dimColor>{isDesk ? 'OFF ' : 'off '}</Text> : <Text key="o" bold color="#5fafd7">ON </Text>,
              ...HZ_LEVELS.map((_, i) => (
                <Text key={`h${i}`} color={i <= lvH ? mix([95, 175, 215], [37, 99, 235], i / 2) : undefined} dimColor={i > lvH}>
                  {i <= lvH ? '■' : '□'}
                </Text>
              )),
              ...(md.humanize !== undefined
                ? [
                    // CLI 표시는 off·low·mid·high
                    <Text key="l" bold>{` ${isDesk ? md.humanize : HZ_CLI[md.humanize] ?? md.humanize}`}</Text>,
                    <Text key="c" dimColor>{` (${hz + 1}/${HZ_LEVELS.length})`}</Text>,
                  ]
                : []),
            ])
            const press = () => {
              const to = nextHumanize(md.humanize)
              void setHumanize($, to)
                .then(() => $.ui.toast(`Humanize 검수 → ${to ? `강도 ${isDesk ? to : HZ_CLI[to] ?? to}` : isDesk ? 'OFF' : 'off'} · 다음 입력부터 적용`))
                .catch(() => undefined)
            }
            return isDesk ? (
              <Box flexDirection="row" alignItems="center">
                <Text color="#5fafd7">●</Text>
                <Button plain key="mode-humanize" label="Humanize" onPress={press} />
                {state}
              </Box>
            ) : (
              <Box flexDirection="row">
                <Text color="#5fafd7">● </Text>
                <Button plain key="mode-humanize" label="Humanize" onPress={press} />
                <Text> </Text>
                {state}
              </Box>
            )
          })()}
          {/* 데스크톱: Humanize 옆에 글자 버튼 × 단계 목록 비우기 · ➤ 진행 창 열기·닫기 (터미널은 맨 위 [×] [‣]) */}
          {isDesk && [
            <Text key="bs" dimColor>{' । '}</Text>,
            <Button key="steps-clear" plain label="×" onPress={() => void $.command.run({ command: 'steps-clear' }).catch(() => undefined)} />,
            <Button key="progress" plain label="➤" onPress={() => void $.command.run({ command: 'progress-toggle' }).catch(() => undefined)} />,
          ]}
        </Box>
    )
    const pickerRow = pk && (
          // 선택 줄: 지금 값은 굵게, 누르면 바로 /model·/effort 실행. [×] 닫기
          <Box flexDirection="row" marginBottom={1}>
            <Text dimColor>{`${pk[0]!.toUpperCase() + pk.slice(1)}:  `}</Text>
            {(pk === 'model'
              ? MODELS.map(o => ({ value: o.alias, label: o.label, isNow: m.name === o.label }))
              : pk === 'advisor'
                ? ADVISORS.map(o => ({ value: o.alias, label: o.label, isNow: (m.advisor ?? 'off') === o.alias }))
                : EFFORTS.map(o => ({ value: o, label: o.toUpperCase(), isNow: m.effort === o }))
            ).flatMap((o, i) => [
              ...(i > 0 ? [<Text key={`ps${i}`}> </Text>] : []),
              <Button key={`p-${o.value}`} plain onPress={() => void pick($, pk, o.value, o.label).catch(() => undefined)}>
                <Text bold={o.isNow} color={o.isNow ? '#d97757' : undefined}>{`[${o.label}]`}</Text>
              </Button>,
            ])}
            <Text>  </Text>
            <Button plain key="p-close" label="[×]" onPress={() => void update($, picker, () => null).catch(() => undefined)} />
          </Box>
        )
    const effortView = m.effort === undefined ? (
                <Text dimColor>-</Text>
              ) : Svg && lvl >= 0 ? (
                seg(EFFORTS.length, lvl + 1, ['#4f46e5', '#a855f7'], `Effort ${EFFORTS[lvl]}`)
              ) : lvl < 0 ? (
                <Text bold>{String(m.effort)}</Text>
              ) : (
                // Fragment 는 세로로 쌓여 깨짐 → 가로 Box 로 묶음
                <Box flexDirection="row">
                  {EFFORTS.map((_, i) => (
                    <Text key={`e${i}`} color={i <= lvl ? mix([79, 70, 229], [168, 85, 247], i / 4) : undefined} dimColor={i > lvl}>
                      {i <= lvl ? '■' : '□'}
                    </Text>
                  ))}
                  <Text bold>{` ${EFFORTS[lvl]!.toUpperCase()}`}</Text>
                  <Text dimColor>{` (${lvl + 1}/${EFFORTS.length})`}</Text>
                </Box>
              )

    if (isDesk) {
      // 데스크톱: 조작 줄만 그리고 아래(task-progress-band 의 단계·막대)를 이어 붙임
      const below = await next(e)
      return (
        <Box flexDirection="column" paddingX={1}>
          {/* 단계 줄 (× 비우기 · ➤ 진행 창 버튼은 모드 줄 Humanize 옆) */}
          {stepsRow || <Text dimColor>단계 없음</Text>}
          {modesRow}
          {pickerRow}
          {/* 왼쪽: Model 줄 + 아래 task-progress-band 게이지(컨텍스트·5시간·7일) / 오른쪽: 터미널과 같은 옆 칸 4줄 */}
          <Box flexDirection="row">
            <Box flexDirection="column" flexGrow={1} flexShrink={1}>
              {/* Model 줄: 컨텍스트 줄 바로 위 (빈 줄 없이). 줄바꿈하면 옆 칸 4줄과 높이가 어긋나 한 줄 고정. Advisor 는 옆 칸에 */}
              <Box flexDirection="row" alignItems="center" gap={1}>
                {/* 데스크톱 버튼은 안의 글자색을 무시함: ● 은 버튼 밖 색 글자, 타이틀은 버튼(누르면 선택 줄) */}
                {/* 간격 없는 묶음: 모드 줄 ● 과 같은 간격 */}
                <Box flexDirection="row" alignItems="center">
                  <Text color="#d97757">●</Text>
                  <Button plain key="pick-model" label="Model" onPress={() => toggle('model')} />
                </Box>
                <Text bold>{m.name ?? '-'}</Text>
                <Text dimColor>{' । '}</Text>
                <Button plain key="pick-effort" label="Effort" onPress={() => toggle('effort')} />
                {effortView}
              </Box>
              {below}
            </Box>
            {/* 옆 칸: /usage-band off 로 끔 */}
            {isBeside && (
              <Box flexDirection="row" flexShrink={0} paddingLeft={1}>
                <Box flexDirection="column" marginRight={1}>
                  {side.map((_, i) => (
                    <Text key={`v${i}`} dimColor>│</Text>
                  ))}
                </Box>
                {/* 폭을 고정하지 않음: Advisor·Render 값이 길어도 잘리지 않고 다 보이게 */}
                <Box flexDirection="column" flexShrink={0}>
                  {side}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )
    }

    return (
      // 오른쪽 여백 없이 붙여 버튼이 엔진의 [-] 바로 옆에 오게
      <Box flexDirection="column" paddingLeft={1}>
        {/* 위 스피너·팁 줄과 분리하는 구분선 */}
        {/* 왼쪽 끝 버튼: [×] 단계 목록 비우기(/steps-clear) · [‣] 옆 패널 열기·닫기(/progress-toggle), 그 뒤로 구분선. 엔진의 [-] 는 맨 오른쪽 5칸 고정 */}
        <Box flexDirection="row">
          <Button plain label="[×]" onPress={() => void $.command.run({ command: 'steps-clear' }).catch(() => undefined)} />
          <Text> </Text>
          <Button plain label="[‣]" onPress={() => void $.command.run({ command: 'progress-toggle' }).catch(() => undefined)} />
          <Text> </Text>
          <Text dimColor>{'─'.repeat(Math.max(10, e.props.bodyColumns - 1 - 8))}</Text>
        </Box>
        {/* 아래 입력창 앞 엔진 여백(1줄)과 맞추는 빈 줄 */}
        <Text> </Text>
        {stepsRow}
        {/* 펼친 서브에이전트 목록: 이름 누르면 hc 는 attach 명령 복사·Agent 는 그 화면, ✕ 는 hc 종료 */}
        {isSubsOpen && (
          // 단계 줄과 빈 줄 1칸 띄우고 제목 + 목록
          <Box flexDirection="column" marginBottom={1}>
            <Text bold>Subagents list</Text>
            {mine.map(a => (
              <Box key={`ts-${a.id}`} flexDirection="row">
                <Text dimColor>{'  └ '}</Text>
                <Text dimColor>{a.type === 'hc' ? 'hc । ' : 'sub । '}</Text>
                <Button
                  key={`ts-name-${a.id}`}
                  plain
                  onPress={press =>
                    void (a.type === 'hc'
                      ? $.ui.copy({ text: `hc attach ${a.id.slice(3)}`, surface: press.surface }).then(() => $.ui.toast(`hc attach ${a.id.slice(3)} 복사됨`))
                      : $.ui.view({ agentId: a.id })
                    ).catch(() => undefined)
                  }
                >
                  <Text color="blue">{a.description}</Text>
                </Button>
                <Text dimColor>{`  · ${a.status}  `}</Text>
                {a.type === 'hc' && (
                  <Button
                    key={`ts-kill-${a.id}`}
                    plain
                    dimColor
                    onPress={() =>
                      void $.process
                        .run(['hc', 'kill', a.id.slice(3)])
                        .then(x => $.ui.toast(x.exitCode === 0 ? `${a.description} 종료` : `종료 실패: ${(x.stderr || x.stdout).trim().slice(0, 80)}`))
                        .catch(() => undefined)
                    }
                  >
                    ✕
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        )}
        {/* 모드 줄(단계 줄과 Model 줄 사이, 위아래 빈 줄 1칸 — 모델 선택 줄이 열릴 때 덜 붙어 보이게): 단계 줄처럼 가로 1줄, ' । ' 로 구분. ON/OFF + 강도 칸 (Effort 와 같은 모양) */}
        {modesRow}
        {pickerRow}
        <Box flexDirection="row">
          <Box flexDirection="column">
            {/* 모델 · 추론 단계 줄 */}
            <Box flexDirection="row">
              <Box width={13}>
                <Text color="#d97757">● </Text>
                {/* 이름 클릭: 아래 선택 줄 열기·닫기 */}
                <Button plain key="pick-model" label="Model" onPress={() => toggle('model')} />
              </Box>
              <Box width={12}>
                <Text bold>{m.name ?? '-'}</Text>
              </Box>
              <Button plain key="pick-effort" label="Effort" onPress={() => toggle('effort')} />
              <Text> </Text>
              {effortView}
            </Box>
            {ROWS.map(row => {
              const g = s[row.key]
              const pct = g?.percent ?? 0
              const filled = Math.round((Math.min(pct, 100) / 100) * BAR)
              return (
                <Box key={row.key} flexDirection="row">
                  <Box width={13}>
                    <Text color={row.dot}>● </Text>
                    <Text>{row.label}</Text>
                  </Box>
                  <Box width={BAR + 2}>
                    {Array.from({ length: BAR }, (_, i) => {
                      if (i < filled) return <Text key={`c${i}`} color={mix(row.from, row.to, i / BAR)}>█</Text>
                      const tick = i === BAR / 4 || i === BAR / 2 || i === (BAR * 3) / 4
                      return <Text key={`c${i}`} dimColor>{tick ? '┃' : '░'}</Text>
                    })}
                  </Box>
                  <Box width={6}>
                    <Text bold>{g ? `${Math.round(pct)}%`.padStart(4) : '  - '}</Text>
                  </Box>
                  <Text dimColor>{g ? g.detail || until(g.resetsAt, now) : '대기 중'}</Text>
                </Box>
              )
            })}
          </Box>
          {isSide && (
            <Box flexDirection="row" paddingLeft={2}>
              {/* 열 구분선: 옆 칸 4줄 높이 */}
              <Box flexDirection="column" marginRight={2}>
                {side.map((_, i) => (
                  <Text key={`v${i}`} dimColor>│</Text>
                ))}
              </Box>
              {/* 폭을 정해 줘야 긴 줄이 아래로 넘치지 않고 잘림: 터미널 폭 - 게이지 열 - 여백 */}
              <Box flexDirection="column" width={sideW}>
              {side}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    )
  })
}

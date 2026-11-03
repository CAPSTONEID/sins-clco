import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Gauge, ModelInfo, Snapshot } from '../types'

const snap = atom({ plugin: 'usage-band', key: 'snap' } as const, {} as Snapshot)
// progress-pane 이 쓰는 값을 읽기만 함 (다른 플러그인 값은 읽기 허용, 쓰기는 주인만)
const run = atom({ plugin: 'progress-pane', key: 'run' } as const, null)
const jobs = atom({ plugin: 'progress-pane', key: 'jobs' } as const, [])
// 옆 칸 표시 여부: 옵션 기본값 위에 /usage-band 로 정한 값($.store)이 우선
const beside = atom({ plugin: 'usage-band', key: 'beside' } as const, true)
const agents = atom({ plugin: 'progress-pane', key: 'agents' } as const, [])
// 종류별 과거 렌더 소요 시간(초) — 진행률(%) 추정용
// 단계 목록(progress-pane steps 도구) — 세션이 끝나도 유지, [×] 로 비움
const stepList = atom({ plugin: 'progress-pane', key: 'steps' } as const, [])
const renderHistory = atom({ plugin: 'progress-pane', key: 'renderHistory' } as const, {})
const model = atom({ plugin: 'usage-band', key: 'model' } as const, {} as ModelInfo)

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
const GAUGE_W = 14 + BAR_NARROW + 2 + 6 + 22
const SIDE_MIN = 24

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
type Step = { subject: string; status: string }
export const fitSteps = (tasks: readonly Step[], width: number) => {
  const size = (list: readonly Step[], cap: number) =>
    list.reduce((n, t) => n + 2 + cells(cut(t.subject, cap)), 0) + 3 * Math.max(0, list.length - 1)
  const pick = (list: readonly Step[], cap: number) => list.map(t => ({ text: cut(t.subject, cap), status: t.status }))
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
    await update($, model, m => ({ ...m, name: prettyModel(id) }))
    // 1분마다 다시 읽어 그림 → 턴 사이에도 "N분 후 초기화" 카운트다운이 흐름
    // ponytail: 한도 값은 이 세션의 API 응답 기준, 다른 세션(하이퍼프레임 등) 사용분은 이 세션이 다음 요청을 보내야 반영
    $.clock.every(60_000, async () => {
      const u = await $.session.usage()
      await update($, snap, () => toSnap(u.context, u.rateLimits))
    })
    return r
  })

  on('command.run', { command: 'usage-band' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const cur = await read($, beside)
    const next = arg === 'on' ? true : arg === 'off' ? false : !cur
    await $.store.set('beside', next)
    await update($, beside, () => next)
    return { text: `작업·렌더 옆 칸: ${next ? '켜짐' : '꺼짐'}` }
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
    // CLI(터미널) 전용: 데스크톱 앱은 task-progress-band 가 그린다. VS Code 확장 채팅 패널은 mod 화면을 그리지 않음 (VS Code 내장 터미널의 claude 는 usage-band)
    if (e.surface !== 'terminal' || e.props.hasSurvey || (!ROWS.some(r => s[r.key]) && !m.name)) return next(e)
    // 추론 단계 위치 (1~5), 문자열 아닌 숫자 effort 면 -1
    const lvl = typeof m.effort === 'string' ? EFFORTS.indexOf(m.effort as (typeof EFFORTS)[number]) : -1

    const now = await $.clock.now()
    const { Box, Text, Button } = $.ui.resolve(e)
    // 옆 칸: 줄 수가 4줄(Model + 게이지 3)과 같음. 터미널이 좁으면 생략
    const isBeside = await read($, beside)
    const r = isBeside ? await read($, run) : null
    const list = isBeside ? await read($, jobs) : []
    const isSide = isBeside && e.props.bodyColumns >= GAUGE_W + SIDE_MIN + 6
    const BAR = isSide ? BAR_NARROW : BAR_WIDE
    const total = r?.tasks.length ?? 0
    const done = r?.tasks.filter(t => t.status === 'completed').length ?? 0
    // 단계 줄: 옆 칸 설정과 무관하게 단계 목록이 있으면 표시
    const tasks = await read($, stepList)
    const count = `  ${tasks.filter(t => t.status === 'completed').length}/${tasks.length}`
    const fit = fitSteps(tasks, e.props.bodyColumns - 1 - cells(count) - 4)
    // 일하는 서브에이전트: 여러 개여도 아래 줄로 쌓지 않고 ' ।। ' 로 이어 한 줄에 (넘치면 잘림)
    const live = isBeside ? (await read($, agents)).filter(a => a.status === 'running') : []
    const SEP = ' ।। '
    const subs = live.map(a => `sub ${a.description.slice(0, 12)}`)
    const past = list.length ? await read($, renderHistory) : {}
    // 렌더 시간 ‣ 진행률: "렌더 hyperframes 8:59 ‣ 42%" (기록 없으면 시간만)
    const renders = list.map(j => {
      const pct = renderPct(j.seconds, past[j.kind])
      return `렌더 ${j.kind} ${clock(j.seconds)}${pct === undefined ? '' : ` ‣ ${pct}%`}`
    })
    const side = [
      r ? (
        <Text key="s0" bold color="cyan" wrap="truncate">{`▶ ${r.label ?? (r.prompt.trim().split('\n')[0] ?? '작업').slice(0, 18)}`}</Text>
      ) : (
        <Text key="s0" dimColor>작업 대기 중</Text>
      ),
      r ? (
        <Text key="s1">{total ? `${done}/${total} 완료 · ${Math.round((done / total) * 100)}%` : '진행 중'}</Text>
      ) : (
        <Text key="s1"> </Text>
      ),
      r || subs.length ? (
        <Text key="s2" dimColor wrap="truncate">{[r ? `⏱ ${dur(r.now - r.startedAt)} · 도구 ${r.tools}회` : '', ...subs].filter(Boolean).join(SEP)}</Text>
      ) : (
        <Text key="s2"> </Text>
      ),
      renders.length ? (
        <Text key="s3" color="blue" wrap="truncate">{renders.join(SEP)}</Text>
      ) : (
        <Text key="s3" dimColor>렌더 없음</Text>
      ),
    ]

    return (
      // 오른쪽 여백 없이 붙여 버튼이 엔진의 [-] 바로 옆에 오게
      <Box flexDirection="column" paddingLeft={1}>
        {/* 위 스피너·팁 줄과 분리하는 구분선 */}
        {/* 오른쪽 끝 버튼: [×] 단계 목록 비우기(/steps-clear) · [‣] 옆 패널 열기·닫기(/progress-toggle). 엔진의 [-] 는 맨 오른쪽 5칸 고정 */}
        <Box flexDirection="row">
          <Text dimColor>{'─'.repeat(Math.max(10, e.props.bodyColumns - 1 - 8))}</Text>
          <Text> </Text>
          <Button plain label="[×]" onPress={() => void $.command.run({ command: 'steps-clear' }).catch(() => undefined)} />
          <Text> </Text>
          <Button plain label="[‣]" onPress={() => void $.command.run({ command: 'progress-toggle' }).catch(() => undefined)} />
        </Box>
        {/* 아래 입력창 앞 엔진 여백(1줄)과 맞추는 빈 줄 */}
        <Text> </Text>
        {tasks.length > 0 && (
          // 가로 1줄, ' । ' 로 구분: 완료 ✔ 흐리게 · 진행 중 ◐ 청록 굵게 · 대기 ◌
          <Box flexDirection="row" marginBottom={1}>
            {fit.before && <Text dimColor>… </Text>}
            {fit.items.flatMap((it, i) => [
              ...(i > 0 ? [<Text key={`l${i}`} dimColor>{' । '}</Text>] : []),
              it.status === 'completed' ? (
                <Text key={`t${i}`} dimColor>{`✔ ${it.text}`}</Text>
              ) : it.status === 'in_progress' ? (
                <Text key={`t${i}`} bold color="#1fb5c9">{`◐ ${it.text}`}</Text>
              ) : (
                <Text key={`t${i}`}>{`◌ ${it.text}`}</Text>
              ),
            ])}
            {fit.after && <Text dimColor> …</Text>}
            <Text bold>{count}</Text>
          </Box>
        )}
        <Box flexDirection="row">
          <Box flexDirection="column">
            {/* 모델 · 추론 단계 줄 */}
            <Box flexDirection="row">
              <Box width={14}>
                <Text color="#d97757">● </Text>
                <Text>Model</Text>
              </Box>
              <Box width={20}>
                <Text bold>{m.name ?? '-'}</Text>
              </Box>
              <Text>Effort </Text>
              {m.effort === undefined ? (
                <Text dimColor>-</Text>
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
              )}
            </Box>
            {ROWS.map(row => {
              const g = s[row.key]
              const pct = g?.percent ?? 0
              const filled = Math.round((Math.min(pct, 100) / 100) * BAR)
              return (
                <Box key={row.key} flexDirection="row">
                  <Box width={14}>
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
              {/* 열 구분선: 4줄 높이로 이어지는 세로선 */}
              <Box flexDirection="column" marginRight={2}>
                {side.map((_, i) => (
                  <Text key={`v${i}`} dimColor>│</Text>
                ))}
              </Box>
              {/* 폭을 정해 줘야 긴 줄이 아래로 넘치지 않고 잘림: 터미널 폭 - 게이지 열 - 여백 */}
              <Box flexDirection="column" width={Math.max(SIDE_MIN, e.props.bodyColumns - GAUGE_W - 9)}>
              {side}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    )
  })
}

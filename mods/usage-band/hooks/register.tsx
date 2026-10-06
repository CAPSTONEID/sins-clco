import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Gauge, ModelInfo, Snapshot } from '../types'

const snap = atom({ plugin: 'usage-band', key: 'snap' } as const, {} as Snapshot)
const model = atom({ plugin: 'usage-band', key: 'model' } as const, {} as ModelInfo)

// 추론 단계 순서 (단계 표시용)
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const

// 모델 id → 표시 이름: claude-opus-5-5 → Opus 5.5, claude-haiku-4-5-20251001 → Haiku 4.5
export const prettyModel = (id: string) => {
  const parts = id.replace(/\[.*\]$/, '').replace(/^claude-/, '').split('-').filter(p => !/^\d{8}$/.test(p))
  const name = parts.filter(p => !/^\d+$/.test(p)).map(p => p[0]!.toUpperCase() + p.slice(1)).join(' ')
  const ver = parts.filter(p => /^\d+$/.test(p)).join('.')
  return [name || id, ver].filter(Boolean).join(' ')
}

// 게이지 막대 칸 수 (25/50/75% 눈금 포함)
const BAR = 32

// 행별 그라데이션 시작·끝 색 (이미지 시안 기준)
const ROWS = [
  { key: 'context', label: '컨텍스트', dot: '#1fb5c9', from: [31, 181, 201], to: [37, 99, 235] },
  { key: 'fiveHour', label: '5시간 한도', dot: '#3b6cf6', from: [59, 108, 246], to: [79, 70, 229] },
  { key: 'sevenDay', label: '7일 한도', dot: '#5b4ff0', from: [79, 70, 229], to: [168, 85, 247] },
] as const

// 토큰 수를 349K / 1.0M 형태로
const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}K`)

// 두 RGB 사이 보간 → hex
const mix = (a: readonly number[], b: readonly number[], t: number) =>
  '#' + a.map((v, i) => Math.round(v + ((b[i] ?? v) - v) * t).toString(16).padStart(2, '0')).join('')

// 초기화까지 남은 시간 → "1일 19시간" / "4시간 46분"
const until = (iso: string | undefined, now: number) => {
  if (!iso) return ''
  const min = Math.max(0, Math.round((Date.parse(iso) - now) / 60000))
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

export const register: Register = on => {
  // 시작 시 1회 읽기 (resume 세션이면 바로 값이 있음)
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    const u = await $.session.usage()
    await update($, snap, () => toSnap(u.context, u.rateLimits))
    const id = await $.session.model()
    await update($, model, m => ({ ...m, name: prettyModel(id) }))
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
    // CLI(터미널) 전용: 데스크톱·VS Code 는 task-progress-band 가 그린다
    if (e.surface !== 'terminal' || e.props.hasSurvey || (!ROWS.some(r => s[r.key]) && !m.name)) return next(e)
    // 추론 단계 위치 (1~5), 문자열 아닌 숫자 effort 면 -1
    const lvl = typeof m.effort === 'string' ? EFFORTS.indexOf(m.effort as (typeof EFFORTS)[number]) : -1

    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" paddingX={1}>
        {/* 위 스피너·팁 줄과 분리하는 구분선 */}
        <Text dimColor>{'─'.repeat(Math.max(10, e.props.bodyColumns - 2))}</Text>
        {/* 아래 입력창 앞 엔진 여백(1줄)과 맞추는 빈 줄 */}
        <Text> </Text>
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
    )
  })
}

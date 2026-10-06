import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Gauge, Snapshot } from '../types'

const snap = atom({ plugin: 'usage-band', key: 'snap' } as const, {} as Snapshot)

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
    return r
  })

  // 턴 종료·한도 변동 시 엔진이 밀어주는 값으로 갱신
  on('session.measure', async ($, e, next) => {
    await update($, snap, () => toSnap(e.context, e.rateLimits))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, snap)
    if (e.props.hasSurvey || !ROWS.some(r => s[r.key])) return next(e)

    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" paddingX={1}>
        {/* 위 스피너·팁 줄과 분리하는 구분선 */}
        <Text dimColor>{'─'.repeat(Math.max(10, e.props.bodyColumns - 2))}</Text>
        {/* 아래 입력창 앞 엔진 여백(1줄)과 맞추는 빈 줄 */}
        <Text> </Text>
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

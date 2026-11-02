import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Gauge, ModelInfo, Snapshot } from '../types'

const snap = atom({ plugin: 'usage-band', key: 'snap' } as const, {} as Snapshot)
// progress-pane 이 쓰는 값을 읽기만 함 (다른 플러그인 값은 읽기 허용, 쓰기는 주인만)
const run = atom({ plugin: 'progress-pane', key: 'run' } as const, null)
const jobs = atom({ plugin: 'progress-pane', key: 'jobs' } as const, [])
// 옆 칸 표시 여부: 옵션 기본값 위에 /usage-band 로 정한 값($.store)이 우선
const beside = atom({ plugin: 'usage-band', key: 'beside' } as const, true)
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
    const { Box, Text } = $.ui.resolve(e)
    // 옆 칸: 줄 수가 4줄(Model + 게이지 3)과 같음. 터미널이 좁으면 생략
    const isBeside = await read($, beside)
    const r = isBeside ? await read($, run) : null
    const list = isBeside ? await read($, jobs) : []
    const isSide = isBeside && e.props.bodyColumns >= GAUGE_W + SIDE_MIN + 6
    const BAR = isSide ? BAR_NARROW : BAR_WIDE
    const total = r?.tasks.length ?? 0
    const done = r?.tasks.filter(t => t.status === 'completed').length ?? 0
    const job = list[0]
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
      r ? (
        <Text key="s2" dimColor wrap="truncate">{`⏱ ${dur(r.now - r.startedAt)} · 도구 ${r.tools}회`}</Text>
      ) : (
        <Text key="s2"> </Text>
      ),
      job ? (
        <Text key="s3" color="yellow" wrap="truncate">{`렌더 ${job.kind} ${clock(job.seconds)}${list.length > 1 ? ` 외 ${list.length - 1}` : ''}`}</Text>
      ) : (
        <Text key="s3" dimColor>렌더 없음</Text>
      ),
    ]

    return (
      <Box flexDirection="column" paddingX={1}>
        {/* 위 스피너·팁 줄과 분리하는 구분선 */}
        <Text dimColor>{'─'.repeat(Math.max(10, e.props.bodyColumns - 2))}</Text>
        {/* 아래 입력창 앞 엔진 여백(1줄)과 맞추는 빈 줄 */}
        <Text> </Text>
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
              <Box flexDirection="column">
              {side}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    )
  })
}

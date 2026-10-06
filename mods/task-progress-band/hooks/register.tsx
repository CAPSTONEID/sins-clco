import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Ctx, Limit, ModelInfo, TaskStatus } from '../types'

const tasks = atom({ plugin: 'task-progress-band', key: 'tasks' } as const, {} as Record<string, TaskStatus>)
const isHidden = atom({ plugin: 'task-progress-band', key: 'isHidden' } as const, false)
const limits = atom({ plugin: 'task-progress-band', key: 'limits' } as const, [] as Limit[])
const context = atom({ plugin: 'task-progress-band', key: 'context' } as const, null as Ctx | null)
const now = atom({ plugin: 'task-progress-band', key: 'now' } as const, 0)
// 이번 세션에서 엔진이 사용량을 한 번이라도 알려줬는지. false면 지난 세션 값으로 그리는 중
const isFresh = atom({ plugin: 'task-progress-band', key: 'isFresh' } as const, false)
const model = atom({ plugin: 'task-progress-band', key: 'model' } as const, {} as ModelInfo)

// 추론 단계 순서 (단계 표시용)
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const
const EFFORT: Grad = ['#4f46e5', '#a855f7']

// ponytail: usage-band 와 같은 함수. 플러그인끼리 import 못 해 복사함
// 모델 id → 표시 이름: claude-opus-5-5 → Opus 5.5, claude-haiku-4-5-20251001 → Haiku 4.5
export const prettyModel = (id: string) => {
  const parts = id.replace(/\[.*\]$/, '').replace(/^claude-/, '').split('-').filter(p => !/^\d{8}$/.test(p))
  const name = parts.filter(p => !/^\d+$/.test(p)).map(p => p[0]!.toUpperCase() + p.slice(1)).join(' ')
  const ver = parts.filter(p => /^\d+$/.test(p)).join('.')
  return [name || id, ver].filter(Boolean).join(' ')
}

// ponytail: 작업 막대는 세션 전체 하나. 목록별 막대는 작업 metadata에 묶음 키가 생기면 추가

// 줄마다 다른 그라디언트 [시작색, 끝색]: 위에서 아래로 시안 → 블루 → 인디고 → 퍼플 스펙트럼
type Grad = readonly [string, string]
const TASKS: Grad = ['#8b5cf6', '#ec4899']
const DONE: Grad = ['#10b981', '#34d399']
const CONTEXT: Grad = ['#06b6d4', '#3b82f6']
const FIVE_HOUR: Grad = ['#3b82f6', '#6366f1']
const SEVEN_DAY: Grad = ['#6366f1', '#a855f7']
const WARN: Grad = ['#f59e0b', '#f97316']
const DANGER: Grad = ['#f97316', '#ef4444']

const LIMITS: Record<string, { label: string; grad: Grad }> = {
  five_hour: { label: '5시간 한도', grad: FIVE_HOUR },
  seven_day: { label: '7일 한도', grad: SEVEN_DAY },
}

// 표 한 줄: 모든 줄이 같은 열 폭을 써서 막대·숫자·초기화 시간이 세로로 정렬된다
type Row = { key: string; label: string; pct: number; grad: Grad; value: string; note: string; ticks: number }

// 임계치를 넘으면 줄 고유색 대신 주황·빨강 그라디언트로 바꾼다
const level = (pct: number, base: Grad, warn: number, danger: number): Grad =>
  pct >= danger ? DANGER : pct >= warn ? WARN : base

// 토큰 수를 84K, 1.0M 식으로
const tokensText = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${Math.round(n / 1000)}K`)

// 남은 시간을 "3일 4시간", "2시간 13분", "12분"으로. 시간대와 무관한 상대 시간이다
const remaining = (ms: number) => {
  if (ms <= 60_000) return '곧'
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)

  return d > 0 ? `${d}일 ${h}시간` : h > 0 ? `${h}시간 ${m}분` : `${m}분`
}

// 데스크톱용 둥근 막대: 반투명 트랙이라 라이트·다크 테마 모두에서 보인다
// 채운 구간 = 가로 그라디언트 + 위쪽 광택 + 점무늬 질감, 끝에 은은한 빛번짐
const barSvg = (pct: number, [from, to]: Grad, ticks: number) => {
  const W = 360
  const H = 12
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

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const usage = await $.session.usage()
    const { tokens, window, percent } = usage.context
    // 첫 응답 전에는 엔진 사용량이 비어 있다: 세션 간 저장소의 마지막 값으로 막대를 바로 띄운다
    const fresh = usage.rateLimits.length > 0
    const saved = (await $.store.get('limits').catch(() => undefined)) as Limit[] | undefined
    await update($, limits, () => (fresh ? usage.rateLimits : saved ?? []))
    await update($, isFresh, () => fresh)
    await update($, context, () => ({ tokens, window, percent }))
    const t = await $.clock.now()
    await update($, now, () => t)
    // 1분마다 다시 그려 초기화까지 남은 시간을 갱신한다 (리로드 시 이전 타이머는 엔진이 정리)
    const id = await $.session.model()
    await update($, model, m => ({ ...m, name: prettyModel(id) }))
    $.clock.every(60_000, () => void $.clock.now().then(t => update($, now, () => t)))

    return next(e)
  })

  // 턴마다, 그리고 사용량이 1%p 움직일 때마다 엔진이 밀어주는 수치
  on('session.measure', async ($, e, next) => {
    const { tokens, window, percent } = e.context
    const t = await $.clock.now()
    await update($, now, () => t)
    await update($, context, () => ({ tokens, window, percent }))

    // 사용량은 계정 단위라 다음 세션 시작 때 보여줄 수 있게 저장해 둔다 (저장 실패는 표시에 영향 없음)
    if (e.rateLimits.length > 0) {
      await update($, limits, () => e.rateLimits)
      await update($, isFresh, () => true)
      await $.store.set('limits', e.rateLimits).catch(() => {})
    }

    return next(e)
  })

  // 메인 루프 요청마다 실제 모델·추론 단계 반영 (서브에이전트 제외)
  on('turn.step', async function* ($, e, next) {
    if (!e.agentId) {
      const name = prettyModel(e.model)
      await update($, model, m => (m.name === name && m.effort === e.effort ? m : { name, effort: e.effort }))
    }
    return yield* next(e)
  })

  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true) {
      const id = ran.result.task.id
      await update($, tasks, map => ({ ...map, [id]: 'pending' }))
      await update($, isHidden, () => false)
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true && e.status !== undefined) {
      const { status, taskId } = e
      await update($, tasks, map => {
        const { [taskId]: _gone, ...rest } = map

        return status === 'deleted' ? rest : { ...rest, [taskId]: status }
      })
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true) {
      const map: Record<string, TaskStatus> = {}
      e.todos.forEach((todo, i) => (map[`t${i}`] = todo.status))
      await update($, tasks, () => map)
      await update($, isHidden, () => false)
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // 데스크톱 앱 전용: CLI(터미널)는 usage-band 가 그린다. VS Code 확장 채팅 패널은 mod 화면을 그리지 않음 (VS Code 내장 터미널의 claude 는 usage-band)
    if (e.surface === 'terminal' || e.props.hasSurvey) {
      return next(e)
    }

    const statuses = Object.values(await read($, tasks))
    const clock = await read($, now)
    const rows: Row[] = []

    if (statuses.length > 0 && !(await read($, isHidden))) {
      const done = statuses.filter(s => s === 'completed').length
      const total = statuses.length
      const pct = Math.round((done / total) * 100)
      rows.push({
        key: 'tasks',
        label: done === total ? '✓ Done' : 'Tasks',
        pct,
        grad: done === total ? DONE : TASKS,
        value: `${pct}%`,
        note: `${done}/${total} 완료`,
        ticks: total,
      })
    }

    // 컨텍스트: 첫 응답 전에는 창 크기만 알아 '—'로 그린다. 70%부터 주황, 85%부터 빨강(압축 임박)
    const ctx = await read($, context)

    if (ctx !== null && ctx.window > 0) {
      const pct = ctx.percent ?? 0
      rows.push({
        key: 'context',
        label: '컨텍스트',
        pct,
        grad: level(pct, CONTEXT, 70, 85),
        value: ctx.percent === undefined ? '—' : `${ctx.percent}%`,
        note: `${ctx.tokens === undefined ? '—' : tokensText(ctx.tokens)} / ${tokensText(ctx.window)} 토큰`,
        ticks: 4,
      })
    }

    const stale = (await read($, isFresh)) ? '' : ' · 이전 값'

    for (const limit of await read($, limits)) {
      const spec = LIMITS[limit.kind]

      if (spec === undefined) continue

      // 초기화 시각이 지났으면 그 창은 0%에서 다시 시작한 것
      const resetsAt = limit.resetsAt === undefined ? NaN : Date.parse(limit.resetsAt)
      const isReset = resetsAt <= clock
      const pct = isReset ? 0 : limit.percentUsed
      rows.push({
        key: limit.kind,
        label: spec.label,
        pct,
        grad: level(pct, spec.grad, 75, 90),
        value: `${Math.round(pct)}%`,
        note: (Number.isNaN(resetsAt) ? '' : isReset ? '초기화됨' : `${remaining(resetsAt - clock)} 후 초기화`) + stale,
        ticks: 4,
      })
    }

    const m = await read($, model)
    // 추론 단계 위치 (0~4), 숫자 effort 면 -1
    const lvl = typeof m.effort === 'string' ? EFFORTS.indexOf(m.effort as (typeof EFFORTS)[number]) : -1

    if (rows.length === 0 && m.name === undefined) {
      return next(e)
    }

    const table = $.ui.resolve(e)

    // 터미널은 위에서 걸렀다: 데스크톱·VS Code·모바일 표에는 모두 Svg 가 있다
    if (!('Svg' in table)) {
      return next(e)
    }

    const { Box, Button, Svg, Text } = table
    const bar = (row: Row) => <Svg source={barSvg(row.pct, row.grad, row.ticks)} alt={`${row.label} ${row.value}`} />


    // 열 폭은 모든 줄 공통: 라벨 | 막대(가변) | 퍼센트(오른쪽 정렬) | 메모 | 닫기
    return (
      <Box flexDirection="column" paddingX={1}>
        {/* 모델 · 추론 단계 줄: 라벨 열은 다른 줄과 같은 폭 */}
        {m.name !== undefined && (
          <Box key="model" flexDirection="row" alignItems="center" gap={2}>
            <Box width="14%" flexShrink={0}>
              <Text color="#d97757">● </Text>
              <Text wrap="truncate">Model</Text>
            </Box>
            <Box flexGrow={1} flexShrink={1} flexDirection="row" alignItems="center" gap={2}>
              <Text bold>{m.name}</Text>
              <Text dimColor>Effort</Text>
              {m.effort === undefined ? (
                <Text dimColor>—</Text>
              ) : lvl < 0 ? (
                <Text bold>{String(m.effort)}</Text>
              ) : (
                <Box flexDirection="row" alignItems="center">
                  {EFFORTS.map((_, i) => (
                    <Text key={`e${i}`} color={i <= lvl ? EFFORT[i < 2 ? 0 : 1] : undefined} dimColor={i > lvl}>
                      {i <= lvl ? '■' : '□'}
                    </Text>
                  ))}
                  <Text bold>{` ${EFFORTS[lvl]!.toUpperCase()}`}</Text>
                  <Text dimColor>{` (${lvl + 1}/${EFFORTS.length})`}</Text>
                </Box>
              )}
            </Box>
          </Box>
        )}
        {rows.map(row => (
          <Box key={row.key} flexDirection="row" alignItems="center" gap={2}>
            <Box width="14%" flexShrink={0}>
              <Text color={row.grad[0]}>● </Text>
              <Text wrap="truncate">{row.label}</Text>
            </Box>
            <Box flexGrow={1} flexShrink={1} alignItems="center">
              {bar(row)}
            </Box>
            <Box width="6%" flexShrink={0} justifyContent="flex-end">
              <Text bold>{row.value}</Text>
            </Box>
            <Box width="22%" flexShrink={0}>
              <Text dimColor wrap="truncate">{row.note}</Text>
            </Box>
            <Box width={3} flexShrink={0} justifyContent="flex-end">
              {row.key === 'tasks' ? <Button key="hide" label="✕" onPress={() => update($, isHidden, () => true)} /> : <Text> </Text>}
            </Box>
          </Box>
        ))}
      </Box>
    )
  })
}

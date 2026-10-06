import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Run, Task } from '../types'

const PANE = 'progress'
const TITLE = '작업 진행'
const AUTO_OPEN_MS = 60_000 // ponytail: 1분 고정, 바꾸려면 이 값만 수정
const BAR = 30

const run = atom({ plugin: 'progress-pane', key: 'run' } as const, null as Run | null)

// 막대 그라데이션 (usage-band와 같은 청록→보라)
const FROM = [31, 181, 201]
const TO = [168, 85, 247]
const mix = (t: number) =>
  '#' + FROM.map((v, i) => Math.round(v + ((TO[i] ?? v) - v) * t).toString(16).padStart(2, '0')).join('')

// 경과 시간 → "2분 14초"
const dur = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return m ? `${m}분 ${s % 60}초` : `${s}초`
}

// 할 일 목록 갱신
function setTasks($: EngineInterface, fn: (l: Task[]) => Task[]) {
  return update($, run, r => (r ? { ...r, tasks: fn(r.tasks) } : r))
}

export const register: Register = on => {
  let openTimer: Timer | undefined
  let tick: Timer | undefined

  const stopTimers = () => {
    openTimer?.cancel()
    tick?.cancel()
    openTimer = tick = undefined
  }

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'progress', description: '작업 진행 패널 열기' })
    return next(e)
  })

  on('command.run', { command: 'progress' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })
    return { text: '작업 진행 패널을 열었습니다.' }
  })

  // 턴 시작: 기록 초기화 + 1분 뒤 자동 열기 예약 + 1초마다 경과 시간 갱신
  on('turn.start', async ($, e, next) => {
    stopTimers()
    const now = await $.clock.now()
    await update($, run, () => ({ startedAt: now, now, tools: 0, lastTool: '', tasks: [] }))
    openTimer = $.clock.after(AUTO_OPEN_MS, () => void $.ui.open({ id: PANE, title: TITLE }))
    tick = $.clock.every(1000, () => {
      void $.clock.now().then(t => update($, run, r => (r && !r.endedAt ? { ...r, now: t } : r)))
    })
    return next(e)
  })

  // 턴 종료(메인 스레드만): 타이머 정리, 1분 넘었으면 완료 토스트
  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId) return r
    stopTimers()
    const now = await $.clock.now()
    const cur = await read($, run)
    if (cur && !cur.endedAt) {
      await update($, run, x => (x ? { ...x, now, endedAt: now } : x))
      if (now - cur.startedAt >= AUTO_OPEN_MS) $.ui.toast(`작업 완료 · ${dur(now - cur.startedAt)}`)
    }
    return r
  })

  // 도구 호출 집계 (메인 스레드만). 실패해도 도구 실행은 그대로 통과
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (!e.agentId) await update($, run, r => (r ? { ...r, tools: r.tools + 1, lastTool: e.tool } : r))
    return ran
  }).catch(($, e, next) => next(e))

  // 할 일 목록 추적: TodoWrite / TaskCreate / TaskUpdate
  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const ran = await next(e)
    if (!e.agentId)
      await setTasks($, () =>
        e.todos.map((t, i) => ({ id: `todo-${i}`, subject: t.activeForm || t.content, status: t.status })),
      )
    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const ran = await next(e)
    const id = (ran.result as { task?: { id: string } } | undefined)?.task?.id
    if (!e.agentId && id) await setTasks($, l => [...l, { id, subject: e.subject, status: 'pending' }])
    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const ran = await next(e)
    const st = e.status
    if (!e.agentId && (ran.result as { success?: boolean } | undefined)?.success)
      await setTasks($, l =>
        st === 'deleted'
          ? l.filter(t => t.id !== e.taskId)
          : l.map(t => (t.id === e.taskId ? { ...t, subject: e.subject ?? t.subject, status: st ?? t.status } : t)),
      )
    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const r = await read($, run)
    if (!r) return <Text dimColor>아직 진행 중인 작업이 없습니다.</Text>

    const elapsed = (r.endedAt ?? r.now) - r.startedAt
    const total = r.tasks.length
    const done = r.tasks.filter(t => t.status === 'completed').length
    const active = r.tasks.find(t => t.status === 'in_progress')
    const isDone = r.endedAt !== undefined

    // 할 일 목록 있으면 완료 비율, 없으면 움직이는 6칸 블록(진행 중 표시)
    const ratio = isDone ? 1 : total ? done / total : 0
    const filled = Math.round(ratio * BAR)
    const pos = Math.floor(elapsed / 1000) % BAR
    const cell = (i: number) => {
      if (i < filled) return <Text key={`c${i}`} color={mix(i / BAR)}>█</Text>
      if (!total && !isDone && (i - pos + BAR) % BAR < 6) return <Text key={`c${i}`} color={mix(i / BAR)}>▓</Text>
      return <Text key={`c${i}`} dimColor>░</Text>
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          {Array.from({ length: BAR }, (_, i) => cell(i))}
          <Text bold>
            {'  '}
            {isDone ? '완료' : total ? `${done}/${total} · ${Math.round(ratio * 100)}%` : '진행 중'}
          </Text>
        </Box>
        <Text dimColor>
          ⏱ {dur(elapsed)} · 도구 {r.tools}회{r.lastTool && !isDone ? ` · ${r.lastTool}` : ''}
        </Text>
        {active && !isDone && <Text color="cyan">▶ {active.subject}</Text>}
        <Text> </Text>
        {r.tasks.map(t => (
          <Text key={t.id} dimColor={t.status === 'completed'} color={t.status === 'in_progress' ? 'cyan' : undefined}>
            {t.status === 'completed' ? '✔' : t.status === 'in_progress' ? '▶' : '○'} {t.subject}
          </Text>
        ))}
      </Box>
    )
  })
}

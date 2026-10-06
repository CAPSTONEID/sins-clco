import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Run, Task } from '../types'

const PANE = 'progress'
const TITLE = '작업 진행'
const AUTO_OPEN_MS = 60_000 // ponytail: 1분 고정, 바꾸려면 이 값만 수정
const BAR = 30

const run = atom({ plugin: 'progress-pane', key: 'run' } as const, null as Run | null)
// 완료된 작업 기록 (최신이 앞, 세션 동안 유지)
const history = atom({ plugin: 'progress-pane', key: 'history' } as const, [] as Run[])
const HISTORY_MAX = 30

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

// 요약 전 임시 설명: 프롬프트 첫 줄 20자
const fallback = (text: string) => {
  const line = text.trim().split('\n')[0] ?? ''
  return line.length > 20 ? `${line.slice(0, 20)}…` : line || '작업'
}

// 끝난 작업을 haiku로 15자 안팎 한 줄 설명으로 요약해 기록에 붙임
async function summarize($: EngineInterface, r: Run) {
  const steps = r.tasks.map(t => `- ${t.subject}`).join('\n')
  const res = await $.model.complete({
    model: 'haiku',
    system: '사용자 요청과 수행 단계를 보고, 한 작업을 15자 안팎의 한국어 명사구로 요약한다. 따옴표·마침표·이모지 없이 한 줄만 출력한다. 예: 카드뉴스 JSON 설계, 사용량 게이지 구분선 추가',
    prompt: `요청: ${r.prompt.slice(0, 600)}\n단계:\n${steps || '(없음)'}\n사용 도구 수: ${r.tools}`,
    maxTokens: 40,
    timeoutMs: 20_000,
  })
  const label = res.isAnswered ? res.text.trim().split('\n')[0]?.slice(0, 30) : undefined
  if (label) await update($, history, list => list.map(x => (x.id === r.id ? { ...x, label } : x)))
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
    const prev = await read($, run)
    if (prev && !prev.endedAt && prev.tools > 0)
      await update($, history, list => [{ ...prev, endedAt: now, label: prev.label ?? `${fallback(prev.prompt)} (중단)` }, ...list].slice(0, HISTORY_MAX))
    await update($, run, () => ({ id: e.turnId, prompt: e.text, startedAt: now, now, tools: 0, lastTool: '', tasks: [] }))
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
      const done: Run = { ...cur, now, endedAt: now }
      await update($, run, () => null)
      // 도구를 한 번도 안 쓴 대화형 턴은 기록하지 않음
      if (done.tools > 0) {
        await update($, history, list => [done, ...list].slice(0, HISTORY_MAX))
        void summarize($, done).catch(() => undefined)
      }
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
    const hist = await read($, history)
    if (!r && hist.length === 0) return <Text dimColor>아직 기록된 작업이 없습니다.</Text>

    // 진행 중 블록
    let current = <Text dimColor>대기 중</Text>
    if (r) {
      const elapsed = r.now - r.startedAt
      const total = r.tasks.length
      const done = r.tasks.filter(t => t.status === 'completed').length
      const active = r.tasks.find(t => t.status === 'in_progress')
      // 할 일 목록 있으면 완료 비율, 없으면 움직이는 6칸 블록
      const filled = total ? Math.round((done / total) * BAR) : 0
      const pos = Math.floor(elapsed / 1000) % BAR
      const cell = (i: number) => {
        if (i < filled) return <Text key={`c${i}`} color={mix(i / BAR)}>█</Text>
        if (!total && (i - pos + BAR) % BAR < 6) return <Text key={`c${i}`} color={mix(i / BAR)}>▓</Text>
        return <Text key={`c${i}`} dimColor>░</Text>
      }
      current = (
        <Box flexDirection="column">
          <Text bold color="cyan">▶ {fallback(r.prompt)}</Text>
          <Box flexDirection="row">
            {Array.from({ length: BAR }, (_, i) => cell(i))}
            <Text bold>
              {'  '}
              {total ? `${done}/${total} · ${Math.round((done / total) * 100)}%` : '진행 중'}
            </Text>
          </Box>
          <Text dimColor>
            ⏱ {dur(elapsed)} · 도구 {r.tools}회{r.lastTool ? ` · ${r.lastTool}` : ''}
          </Text>
          {active && <Text color="cyan">  └ {active.subject}</Text>}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {current}
        <Text> </Text>
        <Text bold>완료 기록 {hist.length}건</Text>
        {hist.map(x => (
          <Box key={x.id} flexDirection="row">
            <Text color={mix(0)}>✔ </Text>
            <Text>{x.label ?? fallback(x.prompt)}</Text>
            <Text dimColor>
              {'  '}
              {dur((x.endedAt ?? x.now) - x.startedAt)} · 도구 {x.tools}회
              {x.tasks.length ? ` · ${x.tasks.length}단계` : ''}
            </Text>
          </Box>
        ))}
      </Box>
    )
  })
}

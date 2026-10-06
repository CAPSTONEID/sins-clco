import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { RenderJob, Run, Task } from '../types'
import { average, fmt, parsePs } from './render'
import { BAR, dur, fallback, mix } from './run'
import { STAGES, detect, project } from './stage'

const PANE = 'progress'
const TITLE = '진행 상황'
const HISTORY_MAX = 30

// 작업 진행 바: 지금 턴, 완료 기록(최신이 앞, 세션 동안 유지)
const run = atom({ plugin: 'progress-pane', key: 'run' } as const, null as Run | null)
const runs = atom({ plugin: 'progress-pane', key: 'runs' } as const, [] as Run[])
// 렌더 진행: 지금 돌고 있는 렌더, 종류별 과거 소요 시간(초, $.store 'render-history' 에도 저장)
const jobs = atom({ plugin: 'progress-pane', key: 'jobs' } as const, [] as RenderJob[])
const renderHistory = atom({ plugin: 'progress-pane', key: 'renderHistory' } as const, {} as Record<string, number[]>)
// 제작 단계
const current = atom({ plugin: 'progress-pane', key: 'project' } as const, '')
const stages = atom({ plugin: 'progress-pane', key: 'stages' } as const, {} as Record<string, number>)

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
  if (label) await update($, runs, list => list.map(x => (x.id === r.id ? { ...x, label } : x)))
}

// 할 일 목록 갱신
function setTasks($: EngineInterface, fn: (l: Task[]) => Task[]) {
  return update($, run, r => (r ? { ...r, tasks: fn(r.tasks) } : r))
}

// 단계 저장 + 상태줄 갱신
async function setStage($: EngineInterface, name: string, stage: number | undefined): Promise<void> {
  const saved = await update($, stages, all => {
    const copy = { ...all }
    if (stage === undefined) delete copy[name]
    else copy[name] = Math.max(0, Math.min(STAGES.length - 1, stage))
    return copy
  })
  await $.store.set('stages', saved)
  await refreshStatus($)
}

// 창이 화면에 보이면 상태줄은 비우고, 안 보이면 한 줄 요약
async function refreshStatus($: EngineInterface): Promise<void> {
  const isShown = (await $.ui.panes()).some(p => p.id === PANE && p.isPlaced)
  if (isShown) return $.ui.status(undefined)
  const name = await read($, current)
  const stage = (await read($, stages))[name]
  const r = await read($, run)
  const list = await read($, jobs)
  const parts = [`${name} ${stage === undefined ? '단계 미지정' : `▶${STAGES[stage]}`}`]
  if (r && !r.endedAt) {
    const done = r.tasks.filter(t => t.status === 'completed').length
    parts.push(`작업 ${r.tasks.length ? `${done}/${r.tasks.length}` : '진행 중'} ${dur(r.now - r.startedAt)}`)
  }
  if (list.length > 0) parts.push(`렌더 ${list.length}건 ${fmt(Math.max(...list.map(j => j.seconds)))}`)
  $.ui.status(`${parts.join(' · ')} · /progress`)
}

export const register: Register = on => {
  let root = ''
  let tick: Timer | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'progress',
      description: '진행 상황 창 열기 (/progress 대본 처럼 단계 지정, project <이름>, clear)',
      argumentHint: '[단계|project 이름|clear]',
    })
    root = await $.session.cwd()

    const savedHistory = (await $.store.get('render-history')) as Record<string, number[]> | undefined
    const savedStages = (await $.store.get('stages')) as Record<string, number> | undefined
    const savedProject = (await $.store.get('project')) as string | undefined
    if (savedHistory) await update($, renderHistory, () => savedHistory)
    if (savedStages) await update($, stages, () => savedStages)
    await update($, current, () => savedProject ?? project(root, root))

    // 명령어 없이 자동으로 엶 — 좁은 터미널(144칸 미만)에선 넓어질 때까지 대기, 그동안 상태줄 요약
    void $.ui.open({ id: PANE, title: TITLE })

    // 3초마다 ps 로 렌더 프로세스 확인
    // ponytail: ps 폴링이라 진행률(%)은 모름, 평균 소요 시간으로 ETA 추정
    $.clock.every(3000, async () => {
      let found: RenderJob[]
      try {
        const { stdout } = await $.process.run(['ps', '-axo', 'pid=,etime=,command='])
        found = parsePs(stdout)
      } catch {
        return
      }
      const before = await read($, jobs)
      const alive = new Set(found.map(j => j.pid))

      for (const job of before.filter(j => !alive.has(j.pid))) {
        // 3초 미만 단발 프로세스는 기록 안 함
        if (job.seconds < 3) continue
        $.ui.toast(`렌더 끝: ${job.kind} · ${fmt(job.seconds)}`, { timeoutMs: 10000 })
        const saved = await update($, renderHistory, h => ({
          ...h,
          [job.kind]: [...(h[job.kind] ?? []), job.seconds].slice(-10),
        }))
        await $.store.set('render-history', saved)
      }

      if (before.length > 0 || found.length > 0) await update($, jobs, () => found)
      await refreshStatus($)
    })

    return next(e)
  })

  on('command.run', { command: 'progress' }, async ($, e) => {
    const args = e.args.trim()
    const name = await read($, current)

    if (args.startsWith('project ')) {
      const picked = args.slice(8).trim()
      await update($, current, () => picked)
      await $.store.set('project', picked)
    } else if (args === 'clear') {
      await setStage($, name, undefined)
    } else if (args !== '') {
      const i = STAGES.indexOf(args as (typeof STAGES)[number])
      if (i < 0) return { text: `단계 이름은 ${STAGES.join(', ')} 중 하나입니다.` }
      await setStage($, name, i)
    }
    await $.ui.open({ id: PANE, title: TITLE })
    await refreshStatus($)
    return { text: '진행 상황 창을 열었습니다.' }
  })

  // 턴 시작: 진행 바 초기화 + 1초마다 경과 시간 갱신
  on('turn.start', async ($, e, next) => {
    tick?.cancel()
    const now = await $.clock.now()
    const prev = await read($, run)
    if (prev && !prev.endedAt && prev.tools > 0)
      await update($, runs, list => [{ ...prev, endedAt: now, label: prev.label ?? `${fallback(prev.prompt)} (중단)` }, ...list].slice(0, HISTORY_MAX))
    await update($, run, () => ({ id: e.turnId, prompt: e.text, startedAt: now, now, tools: 0, lastTool: '', tasks: [] }))
    tick = $.clock.every(1000, () => {
      void $.clock.now().then(t => update($, run, r => (r && !r.endedAt ? { ...r, now: t } : r)))
    })
    return next(e)
  })

  // 턴 종료(메인 스레드만): 기록 저장, 1분 넘었으면 완료 토스트
  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId) return r
    tick?.cancel()
    tick = undefined
    const now = await $.clock.now()
    const cur = await read($, run)
    if (cur && !cur.endedAt) {
      const done: Run = { ...cur, now, endedAt: now }
      await update($, run, () => null)
      // 도구를 한 번도 안 쓴 대화형 턴은 기록하지 않음
      if (done.tools > 0) {
        await update($, runs, list => [done, ...list].slice(0, HISTORY_MAX))
        void summarize($, done).catch(() => undefined)
      }
      if (now - cur.startedAt >= 60_000) $.ui.toast(`작업 완료 · ${dur(now - cur.startedAt)}`)
    }
    return r
  })

  // 도구 호출: 진행 바 집계 + 프로젝트 전환·단계 자동 전진(뒤로는 자동으로 안 감)
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId) return ran
    await update($, run, r => (r ? { ...r, tools: r.tools + 1, lastTool: e.tool } : r))
    if (ran.deny !== undefined || ran.isError) return ran

    const input = e as unknown as { file_path?: string; command?: string }
    if (input.file_path && root) {
      const p = project(root, input.file_path)
      if (p !== (await read($, current))) {
        await update($, current, () => p)
        await $.store.set('project', p)
        await refreshStatus($)
      }
    }

    const stage = detect(String(e.tool), input.file_path ?? '', input.command ?? '')
    if (stage < 0) return ran
    const name = await read($, current)
    if (stage > ((await read($, stages))[name] ?? -1)) {
      await setStage($, name, stage)
      $.ui.toast(`단계 → ${STAGES[stage]} (${name})`)
    }
    return ran
  }).catch(($, e, next) => next(e)) // 표시가 실패해도 도구 호출은 그대로

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
    const { Box, Button, Text } = $.ui.resolve(e)
    const r = await read($, run)
    const hist = await read($, runs)
    const name = await read($, current)
    const stage = (await read($, stages))[name]
    const list = await read($, jobs)
    const past = await read($, renderHistory)
    const width = Math.max(20, (e.props.bodyColumns ?? 40) - 2)

    // 작업 진행 바: 할 일 목록 있으면 완료 비율, 없으면 움직이는 6칸 블록
    let work = <Text dimColor>대기 중</Text>
    if (r) {
      const elapsed = r.now - r.startedAt
      const total = r.tasks.length
      const done = r.tasks.filter(t => t.status === 'completed').length
      const active = r.tasks.find(t => t.status === 'in_progress')
      const filled = total ? Math.round((done / total) * BAR) : 0
      const pos = Math.floor(elapsed / 1000) % BAR
      const cell = (i: number) => {
        if (i < filled) return <Text key={`c${i}`} color={mix(i / BAR)}>█</Text>
        if (!total && (i - pos + BAR) % BAR < 6) return <Text key={`c${i}`} color={mix(i / BAR)}>▓</Text>
        return <Text key={`c${i}`} dimColor>░</Text>
      }
      work = (
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
        <Text bold>작업 진행</Text>
        {work}

        <Box marginTop={1}>
          <Text bold>제작 단계 · {name}</Text>
        </Box>
        <Box flexWrap="wrap">
          {STAGES.map((s, i) => (
            <Text
              key={`s${i}`}
              color={i === stage ? 'cyan' : undefined}
              bold={i === stage}
              dimColor={stage === undefined || i > stage}
            >
              {stage !== undefined && i < stage ? `${s} ✓` : i === stage ? `▶${s}` : s}
              {'  '}
            </Text>
          ))}
        </Box>
        <Box>
          <Button key="back" label="◀ 이전" onPress={() => setStage($, name, (stage ?? 1) - 1)} />
          <Button key="next" label="다음 ▶" variant="primary" onPress={() => setStage($, name, (stage ?? -1) + 1)} />
        </Box>

        <Box marginTop={1}>
          <Text bold>렌더</Text>
        </Box>
        {list.length === 0 && <Text dimColor>진행 중인 렌더 없음</Text>}
        {list.map(job => {
          const avg = average(past[job.kind])
          const eta =
            avg === undefined
              ? '예상 시간: 기록 없음'
              : job.seconds < avg
                ? `남은 시간 약 ${fmt(avg - job.seconds)} (평균 ${fmt(avg)})`
                : `평균 ${fmt(avg)} 초과`
          return (
            <Box key={`j${job.pid}`} flexDirection="column">
              <Text>
                {job.kind} · {fmt(job.seconds)} 경과
              </Text>
              <Text dimColor>{eta}</Text>
              <Text dimColor>{job.command.slice(0, width)}</Text>
            </Box>
          )
        })}

        <Box marginTop={1}>
          <Text bold>완료 기록 {hist.length}건</Text>
        </Box>
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

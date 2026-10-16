import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { AgentRow, FileSnap, RenderJob, Run, Session, SubStat, Task } from '../types'
import { age, parseAgents, splitHidden, toggle } from './agents'
import { planRollback, shortId, SNAP_MAX } from './rollback'
import { average, fmt, parsePs, percent } from './render'
import { BAR, clip, dur, fallback, mix, shortModel } from './run'

const PANE = 'progress'
const TITLE = '진행 상황'
const HISTORY_MAX = 30

// 작업 진행 바: 지금 턴, 완료 기록(최신이 앞, 세션 동안 유지)
const run = atom({ plugin: 'progress-pane', key: 'run' } as const, null as Run | null)
const runs = atom({ plugin: 'progress-pane', key: 'runs' } as const, [] as Run[])
// 렌더 진행: 지금 돌고 있는 렌더, 종류별 과거 소요 시간(초, $.store 'render-history' 에도 저장)
const jobs = atom({ plugin: 'progress-pane', key: 'jobs' } as const, [] as RenderJob[])
const renderHistory = atom({ plugin: 'progress-pane', key: 'renderHistory' } as const, {} as Record<string, number[]>)
// 에이전트 관제: 서브에이전트, 다른 Claude 세션, 종료 확인 대기 항목
const agents = atom({ plugin: 'progress-pane', key: 'agents' } as const, [] as AgentRow[])
const subMeta = atom({ plugin: 'progress-pane', key: 'subMeta' } as const, {} as Record<string, { model: string; effort?: string }>)
const subStats = atom({ plugin: 'progress-pane', key: 'subStats' } as const, {} as Record<string, SubStat>)
// 서브에이전트 작업 상태 실시간 집계 — 도구 호출마다 여기만 고치고, 창 기록은 3초 폴링 때 한 번
// ponytail: 다시 로드되면 session.start 에서 마지막 기록으로 이어 붙임(그 사이 몇 초 분 도구 수는 빠질 수 있음)
const stats = new Map<string, SubStat>()
// Agent 호출의 추론값(effort) — 같은 호출의 agent.spawn 에서 서브에이전트 id 와 짝지음
const efforts = new Map<string, string>()
const sessions = atom({ plugin: 'progress-pane', key: 'sessions' } as const, [] as Session[])
const confirm = atom({ plugin: 'progress-pane', key: 'confirm' } as const, null as string | null)
// 숨긴 세션 id — 세션이 바뀌어도 유지되도록 $.store 'hidden-agents' 에도 저장
const hidden = atom({ plugin: 'progress-pane', key: 'hidden' } as const, [] as string[])
// 제목을 눌러 전체 내용을 펼친 항목 키
const expanded = atom({ plugin: 'progress-pane', key: 'expanded' } as const, [] as string[])
// 보고 있는 탭: 진행(작업·렌더·에이전트) / 완료 기록
const tab = atom({ plugin: 'progress-pane', key: 'tab' } as const, 'now' as 'now' | 'history')
// 숨겨진 에이전트 섹션 펼침 여부 — expanded 목록에 이 키가 있으면 펼침
const HIDDEN_SEC = 'sec:hidden'
// 이 세션(메인) 아래 서브에이전트 접힘 여부 — expanded 목록에 이 키가 있으면 접힘 (기본 펼침)
const SUBS_FOLD = 'fold:subs'
// 제목 옆 작은 버튼 아이콘 (확인 단계의 '정말 종료'·'취소'는 글자 그대로)
const ICON: Record<string, string> = { 종료: '✕', 삭제: '⌫', 숨기기: '⊖', 보이기: '⊕' }
const LIVE = new Set(['pending', 'running', 'waiting', 'idle'])

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

// 창이 화면에 보이면 상태줄은 비우고, 안 보이면 한 줄 요약
async function refreshStatus($: EngineInterface): Promise<void> {
  const isShown = (await $.ui.panes()).some(p => p.id === PANE && p.isPlaced)
  if (isShown) return $.ui.status(undefined)
  const r = await read($, run)
  const list = await read($, jobs)
  const parts: string[] = []
  if (r && !r.endedAt) {
    const done = r.tasks.filter(t => t.status === 'completed').length
    parts.push(`작업 ${r.tasks.length ? `${done}/${r.tasks.length}` : '진행 중'} ${dur(r.now - r.startedAt)}`)
  }
  if (list.length > 0) parts.push(`렌더 ${list.length}건 ${fmt(Math.max(...list.map(j => j.seconds)))}`)
  $.ui.status(parts.length > 0 ? `${parts.join(' · ')} · /progress` : undefined)
}

// 이 세션의 sessionId — 빈 값(조회 실패)이면 자기 세션 오종료 방지 위해 세션 버튼 숨김
let self = ''
// 세션 목록은 3초 타이머 3번에 1번(9초)만 갱신
// ponytail: claude agents --json 은 실행에 0.2초 남짓, 더 자주 부를 이유 없음
let polls = 0

// 값이 실제로 바뀔 때만 기록 → 창을 다시 그림. 3초 폴링이 매번 새 배열을 써서 창이 계속 다시 그려지면
// 그리는 순간 누른 클릭이 이전 그림의 버튼으로 가서 사라짐(가끔 여러 번 눌러야 열리던 원인)
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

// 서브에이전트 목록(매번)과 Claude 세션 목록(9초마다) 갱신. force 면 세션도 즉시
async function pollAgents($: EngineInterface, force = false) {
  try {
    const list = await $.agent.list()
    const v = list.map(a => ({ id: a.id, type: a.type, description: a.description, status: a.status }))
    if (!same(await read($, agents), v)) await update($, agents, () => v)
    const now = await $.clock.now()
    for (const a of list) {
      const st = stats.get(a.id)
      if (st && !st.endedAt && !LIVE.has(a.status)) stats.set(a.id, { ...st, endedAt: now })
    }
    const s = Object.fromEntries(stats)
    // 실행 중인 서브에이전트가 있으면 경과 시간이 바뀌므로 기록(3초마다 한 번 다시 그림)
    if (list.some(a => a.status === 'running') || !same(await read($, subStats), s)) await update($, subStats, () => s)
  } catch {
    // 목록을 못 받으면 이전 값 유지
  }
  if (!force && polls++ % 3 !== 0) return
  try {
    const { stdout } = await $.process.run(['claude', 'agents', '--json', '--all'])
    const v = parseAgents(stdout, self)
    if (!same(await read($, sessions), v)) await update($, sessions, () => v)
    const saved = (await $.store.get('hidden-agents')) as string[] | undefined
    if (saved && !same(await read($, hidden), saved)) await update($, hidden, () => saved)
  } catch {
    // 실패 시 이전 값 유지
  }
}

// 롤백용 원본 사본 위치 — 완료 기록이 세션 동안만 유지되므로 /tmp 에 세션별로 둠
const SNAP_ROOT = '/tmp/progress-pane-snapshots'

// 같은 작업·같은 파일의 사본 뜨는 중 — 동시에 온 편집은 첫 사본이 끝날 때까지 기다림(편집된 내용이 원본 사본에 섞이지 않게)
const snapping = new Map<string, Promise<void>>()

// 파일 하나의 원본 기록: 없는 파일(ENOENT)만 snap null(롤백 때 삭제), 사본을 못 남기면 skip(롤백 때 건드리지 않음)
async function capture($: EngineInterface, r: Run, path: string): Promise<FileSnap> {
  let st
  try {
    st = await $.fs.stat(path)
  } catch (err) {
    const missing = String((err as { code?: unknown } | undefined)?.code ?? err).includes('ENOENT')
    return missing ? { path, snap: null } : { path, snap: null, skip: true }
  }
  // 폴더·링크·1MB 초과 파일은 사본 없이 '건너뜀' — 롤백 때 나중 작업의 사본으로 잘못 덮지 않게
  if (st.kind !== 'file' || st.size > SNAP_MAX) return { path, snap: null, skip: true }
  const snap = `${SNAP_ROOT}/${self || 'session'}/${r.rid ?? shortId(r.id)}/${shortId(path)}${shortId(`${path}#`)}`
  try {
    await $.fs.write(snap, await $.fs.read(path))
  } catch {
    return { path, snap: null, skip: true }
  }
  return { path, snap }
}

// Edit·Write·NotebookEdit 직전: 지금 작업에서 처음 고치는 파일이면 원본을 사본으로 남김
async function snapshot($: EngineInterface, path: string) {
  const r = await read($, run)
  if (!r || r.files?.some(f => f.path === path)) return
  const k = `${r.id}\n${path}`
  const inflight = snapping.get(k)
  if (inflight) return inflight
  const job = (async () => {
    const entry = await capture($, r, path)
    await update($, run, x =>
      x && x.id === r.id && !x.files?.some(f => f.path === path) ? { ...x, files: [...(x.files ?? []), entry] } : x,
    )
  })()
  snapping.set(k, job)
  try {
    await job
  } finally {
    snapping.delete(k)
  }
}

// 대상 작업 전 상태로 파일 되돌리기: 그 뒤 작업이 고친 파일도 함께 원래대로
async function rollback($: EngineInterface, id: string) {
  if (await read($, run)) return $.ui.toast('작업 진행 중에는 롤백할 수 없습니다')
  const plan = planRollback(await read($, runs), id)
  if (!plan) return
  let done = 0
  const failed: string[] = []
  for (const [path, snap] of plan.restore) {
    try {
      if (snap === null) await $.process.run(['rm', '-f', path])
      else await $.fs.write(path, await $.fs.read(snap))
      done++
    } catch {
      failed.push(path.split('/').pop() ?? path)
    }
  }
  await update($, runs, list => list.map(x => (plan.ids.includes(x.id) ? { ...x, rolledBack: true } : x)))
  const skipped = plan.skipped.map(p => p.split('/').pop() ?? p)
  $.ui.toast(
    `작업 ${plan.ids.length}개 롤백 · 파일 ${done}개 복원${failed.length ? ` · 실패 ${failed.length}개: ${failed.join(', ').slice(0, 80)}` : ''}${skipped.length ? ` · 사본 없어 건너뜀 ${skipped.length}개: ${skipped.join(', ').slice(0, 80)}` : ''}`,
    { timeoutMs: 10000 },
  )
}

// 롤백(rb:), 서브에이전트는 TaskStop, 세션은 대화형이면 kill · 백그라운드면 claude stop · 끝났으면 claude rm(대화 기록은 남음)
async function stop($: EngineInterface, key: string) {
  await update($, confirm, () => null)
  try {
    if (key.startsWith('rb:')) {
      await rollback($, key.slice(3))
    } else if (key.startsWith('a:')) {
      await $.tool.call({ tool: 'TaskStop', task_id: key.slice(2) })
      $.ui.toast('서브에이전트를 종료했습니다')
    } else {
      const id = key.slice(2)
      const row = (await read($, sessions)).find(x => x.id === id)
      const ended = row?.isEnded
      // claude stop 은 백그라운드 세션 전용 — 대화형(데스크톱·터미널) 세션은 프로세스 종료(대화 기록은 남음)
      const r =
        !ended && row?.kind === 'interactive' && row.pid
          ? await $.process.run(['kill', '-TERM', String(row.pid)])
          : await $.process.run(['claude', ended ? 'rm' : 'stop', id])
      const verb = ended ? '삭제' : '종료'
      $.ui.toast(r.exitCode === 0 ? `세션 ${id} ${verb}했습니다` : `${verb} 실패: ${(r.stderr || r.stdout).trim().slice(0, 120)}`)
    }
  } catch (err) {
    $.ui.toast(`실패: ${String(err).slice(0, 120)}`)
  }
  await pollAgents($, true)
}

// 세션 숨기기/보이기 전환 + 저장
// ponytail: 삭제된 세션 id 도 목록에 남음, 수백 개 쌓이면 목록에 없는 id 정리 추가
async function toggleHidden($: EngineInterface, id: string) {
  const cur = ((await $.store.get('hidden-agents')) as string[] | undefined) ?? (await read($, hidden))
  const saved = toggle(cur, id)
  await $.store.set('hidden-agents', saved)
  await update($, hidden, () => saved)
}

export const register: Register = on => {
  let tick: Timer | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'progress', description: '진행 상황 창 열기' })

    const savedHistory = (await $.store.get('render-history')) as Record<string, number[]> | undefined
    if (savedHistory) await update($, renderHistory, () => savedHistory)
    for (const [id, st] of Object.entries(await read($, subStats))) if (!stats.has(id)) stats.set(id, st)
    const savedHidden = (await $.store.get('hidden-agents')) as string[] | undefined
    if (savedHidden) await update($, hidden, () => savedHidden)

    // 명령어 없이 자동으로 엶 — 좁은 터미널(144칸 미만)에선 넓어질 때까지 대기, 그동안 상태줄 요약
    void $.ui.open({ id: PANE, title: TITLE })

    self = await $.session.id().catch(() => '')
    // ponytail: 3일 지난 세션의 스냅샷 폴더 정리, 세션이 3일 넘게 이어지면 그 세션 롤백도 사라짐
    void $.process
      .run(['find', SNAP_ROOT, '-mindepth', '1', '-maxdepth', '1', '-mtime', '+3', '-exec', 'rm', '-rf', '{}', '+'])
      .catch(() => undefined)
    void pollAgents($, true)

    // 3초마다 ps 로 렌더 프로세스 확인
    // ponytail: ps 폴링이라 진행률(%)은 모름, 평균 소요 시간으로 ETA 추정
    $.clock.every(3000, async () => {
      let found: RenderJob[]
      try {
        const { stdout } = await $.process.run(['ps', '-axo', 'pid=,ppid=,etime=,command='])
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
        const h = ((await $.store.get('render-history')) as Record<string, number[]> | undefined) ?? (await read($, renderHistory))
        const saved = { ...h, [job.kind]: [...(h[job.kind] ?? []), job.seconds].slice(-10) }
        await $.store.set('render-history', saved)
        await update($, renderHistory, () => saved)
      }

      if (!same(before, found)) await update($, jobs, () => found)
      await pollAgents($)
      await refreshStatus($)
    })

    return next(e)
  })

  // 서브에이전트 모델·추론값 기록: Agent 호출에서 effort, 스폰 결과에서 실제 모델·id
  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    if (e.effort) efforts.set(e.tool_use_id, e.effort)
    return next(e)
  })
  on('agent.spawn', async ($, e, next) => {
    const r = await next(e)
    const effort = efforts.get(e.tool_use_id)
    efforts.delete(e.tool_use_id)
    const id = 'agentId' in r ? r.agentId : undefined
    if (id && !stats.has(id)) stats.set(id, { startedAt: await $.clock.now(), tools: 0, lastTool: '' })
    // ponytail: 세션 동안 쌓임(서브에이전트 수백 개면 끝난 것 정리 추가)
    if (id && 'model' in r && r.model) await update($, subMeta, m => ({ ...m, [id]: { model: r.model, effort } }))
    return r
  })

  on('command.run', { command: 'progress' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })
    await refreshStatus($)
    return { text: '진행 상황 창을 열었습니다.' }
  })

  // 턴 시작: 진행 바 초기화 + 1초마다 경과 시간 갱신
  on('turn.start', async ($, e, next) => {
    // 서브에이전트 턴은 메인 작업 진행을 덮어쓰지 않음 (turn.complete 와 같은 기준)
    if (e.agentId) return next(e)
    tick?.cancel()
    const now = await $.clock.now()
    const prev = await read($, run)
    if (prev && !prev.endedAt && prev.tools > 0)
      await update($, runs, list => [{ ...prev, endedAt: now, label: prev.label ?? `${fallback(prev.prompt)}(중단)` }, ...list].slice(0, HISTORY_MAX))
    await update($, run, () => ({ id: e.turnId, rid: shortId(e.turnId), files: [], prompt: e.text, startedAt: now, now, tools: 0, lastTool: '', tasks: [] }))
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

  // 도구 호출 집계 (메인 스레드만). 실패해도 도구 실행은 그대로 통과
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (!e.agentId && next.origin.plugin !== 'progress-pane') await update($, run, r => (r ? { ...r, tools: r.tools + 1, lastTool: e.tool } : r))
    // 서브에이전트 도구: 메모리에만 세고 창은 3초 폴링 때 반영
    if (e.agentId) {
      const st = stats.get(e.agentId) ?? { startedAt: await $.clock.now(), tools: 0, lastTool: '' }
      stats.set(e.agentId, { ...st, tools: st.tools + 1, lastTool: e.tool })
    }
    return ran
  }).catch(($, e, next) => next(e))

  // 롤백용 원본 사본: 서브에이전트가 고친 파일도 지금 작업에 포함. 실패해도 도구는 그대로 실행
  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    await snapshot($, e.file_path).catch(() => undefined)
    return next(e)
  })
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    await snapshot($, e.file_path).catch(() => undefined)
    return next(e)
  })
  on('tool.call', { tool: 'NotebookEdit' }, async ($, e, next) => {
    await snapshot($, e.notebook_path).catch(() => undefined)
    return next(e)
  })

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
    const { Box, Text, Button } = $.ui.resolve(e)
    const r = await read($, run)
    const hist = await read($, runs)
    const list = await read($, jobs)
    const past = await read($, renderHistory)
    const subs = await read($, agents)
    const meta = await read($, subMeta)
    const subStat = await read($, subStats)
    const procs = await read($, sessions)
    const now = await $.clock.now()
    const asking = await read($, confirm)
    const opened = await read($, expanded)
    const view = await read($, tab)
    const [shown, stashed] = splitHidden(procs, await read($, hidden))

    // 잘린 제목은 누를 수 있는 버튼, 누르면 아래에 전체 내용 펼침 · 다시 누르면 접힘
    // 안 잘린 제목은 그냥 글자
    const title = (key: string, full: string, short: string, always = false) =>
      short === full && !always ? (
        <Text>{full}</Text>
      ) : (
        <Button
          key={`t:${key}`}
          plain
          label={short}
          onPress={() => {
            void update($, expanded, l => toggle(l, key))
            // 접거나 펼 때 '정말 종료' 대기 해제 — 다시 펼쳤을 때 한 번 클릭으로 실행되지 않게
            void update($, confirm, () => null)
          }}
        />
      )
    // 펼친 전체 내용 — 공백 대신 상자 여백으로 들여씀(데스크톱 글꼴에선 공백이 거의 안 보임)
    const detail = (key: string, full: string, short: string) =>
      short !== full && opened.includes(key) ? (
        <Box paddingLeft="xl">
          <Text color="cyan">{`‣ ${full.slice(0, 1000)}`}</Text>
        </Box>
      ) : null
    const width = Math.max(20, (e.props.bodyColumns ?? 40) - 2)

    // 작업 진행 바: 할 일 목록 있으면 완료 비율, 없으면 움직이는 6칸 블록
    const controls = (key: string, verb = '종료') =>
      asking === `${key}#${verb}` ? (
        <Box key={`${key}-c`} flexDirection="row" columnGap="sm">
          <Button key={`${key}-ok`} variant="primary" onPress={() => void stop($, key)}>{`정말 ${verb}`}</Button>
          <Button key={`${key}-no`} onPress={() => void update($, confirm, () => null)}>취소</Button>
        </Box>
      ) : (
        // 크기 설정이 없어 한 글자 아이콘으로 작게 — label 을 주면 데스크톱이 label 글자를 그려서 아이콘만 둠
        <Button key={`${key}-x`} plain dimColor onPress={() => void update($, confirm, () => `${key}#${verb}`)}>
          {ICON[verb] ?? verb}
        </Button>
      )

    // 서브에이전트 한 행(메인 에이전트 아래 xl 여백만큼 들여쓰기) — 1줄: 아이콘 + 'sub । ' + 작업 설명 + 모델 + 작은 종료 버튼(실행 중일 때) / 2줄: 상태 · 경과 · 도구
    const sub = (a: (typeof subs)[number]) => {
      const key = `a:${a.id}`
      const live = LIVE.has(a.status)
      return (
        // 들여쓰기는 공백 대신 상자 여백 — 데스크톱 글꼴에선 공백이 좁아 거의 안 보임
        <Box key={key} flexDirection="column" rowGap="xs" paddingLeft="xl">
          <Box flexDirection="row">
            <Text color={live ? 'cyan' : undefined} dimColor={!live}>
              {a.status === 'running' ? '► ' : live ? '● ' : '○ '}
            </Text>
            <Text>{'sub । '}</Text>
            {title(key, a.description, clip(a.description, 22))}
            {meta[a.id] && (
              <Text dimColor>{`  । ${shortModel(meta[a.id]!.model)} · ${meta[a.id]!.effort ?? '기본'}`}</Text>
            )}
            {live && (
              <Box marginLeft="sm">
                {controls(key)}
              </Box>
            )}
          </Box>
          {detail(key, a.description, clip(a.description, 22))}
          <Text dimColor>
            {'  └ '}
            {a.status}
            {subStat[a.id] &&
              ` · ⏱ ${dur((subStat[a.id]!.endedAt ?? now) - subStat[a.id]!.startedAt)} · 도구 ${subStat[a.id]!.tools}회${
                live && subStat[a.id]!.lastTool ? ` · ${subStat[a.id]!.lastTool}` : ''
              }`}
          </Text>
        </Box>
      )
    }

    // 서브에이전트 목록 — 첫 행 위와 행 사이에 옅은 점선(서브에이전트 들여쓰기에 맞춤)
    const subRows = () =>
      subs.flatMap(a => [
        <Box key={`ga:${a.id}`} paddingLeft="xl">
          <Text color="subtle" dimColor wrap="truncate">{'┄'.repeat(Math.max(0, width - 2))}</Text>
        </Box>,
        sub(a),
      ])

    // 세션 한 행 — 1줄: 아이콘(► 진행 중 · ◼︎ 대기 · ☑︎ 끝남) + 이름 + 작은 종료/삭제 · 숨기기/보이기 버튼 / 2줄: 상태 · 경과 · 폴더
    const session = (x: (typeof procs)[number], isHidden: boolean) => {
      const key = `s:${x.id}`
      // ponytail: 대화형은 status 'busy', 백그라운드는 state 'working' 이 진행 중
      const busy = x.state === 'busy' || x.state === 'working'
      // 대화형 세션은 pid 로만 종료 가능 — pid 없으면 종료 버튼 숨김
      const canStop = self !== '' && (x.isEnded || x.kind !== 'interactive' || x.pid !== undefined)
      return (
        <Box key={key} flexDirection="column" rowGap="xs">
          <Box flexDirection="row">
            <Text color={x.isSelf ? 'cyan' : x.state === 'blocked' ? 'yellow' : undefined} dimColor={x.isEnded || isHidden}>
              {x.isEnded ? '☑︎ ' : busy ? '► ' : '◼︎ '}
            </Text>
            {/* 이 세션은 제목을 누르면 아래 서브에이전트 접기·펴기, 다른 세션은 잘린 제목일 때 전체 이름 펼침 */}
            {x.isSelf
              ? subs.length > 0
                ? // 서브에이전트가 있으면 제목 옆 (n), 누르면 접기·펴기
                  title(SUBS_FOLD, x.name, `${clip(x.name, 28)} (${subs.length})`, true)
                : title(SUBS_FOLD, x.name, clip(x.name, 28))
              : title(key, x.name, clip(x.name, 28))}
            {/* 제목 옆 작은 버튼(글자형·흐리게): 종료/삭제 · 숨기기/보이기 */}
            {!x.isSelf && self !== '' && (
              <Box flexDirection="row" columnGap="sm" marginLeft="sm">
                {canStop && controls(key, x.isEnded ? '삭제' : '종료')}
                <Button key={`${key}-h`} plain dimColor onPress={() => void toggleHidden($, x.id)}>
                  {isHidden ? ICON.보이기 : ICON.숨기기}
                </Button>
              </Box>
            )}
          </Box>
          {detail(key, x.name, clip(x.name, 28))}
          <Text dimColor>
            {'  └ '}
            {x.isSelf ? '이 세션 · ' : ''}
            {x.state} · {x.startedAt ? age(now - x.startedAt) : '?'} · {x.dir}
          </Text>
          {x.isSelf && !opened.includes(SUBS_FOLD) && subRows()}
        </Box>
      )
    }

    // 에이전트 사이 가이드선(옅은 점선) — 첫 행 위엔 없음, 창 너비로 잘라 줄바꿈 방지
    const guided = (rows: typeof procs, isHidden: boolean) =>
      rows.flatMap((x, i) => [
        ...(i > 0 ? [<Text key={`g:${x.id}`} color="subtle" dimColor wrap="truncate">{'┄'.repeat(width)}</Text>] : []),
        session(x, isHidden),
      ])

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
        <Box flexDirection="column" rowGap="xs">
          <Box flexDirection="row">
            <Text bold color="cyan">▶ </Text>
            {title(`r:${r.id}`, r.prompt.trim(), fallback(r.prompt))}
          </Box>
          {detail(`r:${r.id}`, r.prompt.trim(), fallback(r.prompt))}
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
      // 왼쪽 디바이더와 붙지 않게 전체 2칸 들여쓰기
      <Box flexDirection="column" paddingLeft={2}>
        {/* 탭: 지금 보는 탭은 primary(강조색), 다른 탭은 흐리게 */}
        <Box flexDirection="row" marginBottom={1}>
          <Button
            key="tab-now"
            variant={view === 'now' ? 'primary' : undefined}
            dimColor={view !== 'now'}
            onPress={() => void update($, tab, () => 'now')}
          >
            진행
          </Button>
          <Text> </Text>
          <Button
            key="tab-history"
            variant={view === 'history' ? 'primary' : undefined}
            dimColor={view !== 'history'}
            onPress={() => void update($, tab, () => 'history')}
          >
            {`완료 기록 ${hist.length}`}
          </Button>
        </Box>

        {view === 'now' && (
        <Box flexDirection="column" rowGap="sm">
        {/* 탭과 작업 진행 구분 실선 */}
        <Text dimColor wrap="truncate">{'─'.repeat(width)}</Text>
        <Text bold>작업 진행</Text>
        {work}

        <Box marginTop={1}>
          <Text bold>렌더</Text>
        </Box>
        {list.length === 0 && <Text dimColor>진행 중인 렌더 없음</Text>}
        {list.map(job => {
          const avg = average(past[job.kind])
          const pct = percent(job.seconds, avg)
          // 기록 있으면 평균 대비 % 만큼 채움, 없으면 작업 진행 바처럼 움직이는 6칸 블록
          const filled = pct === undefined ? 0 : Math.round((pct / 100) * BAR)
          const pos = job.seconds % BAR
          const cell = (i: number) => {
            if (i < filled) return <Text key={`r${i}`} color={mix(i / BAR)}>█</Text>
            if (pct === undefined && (i - pos + BAR) % BAR < 6) return <Text key={`r${i}`} color={mix(i / BAR)}>▓</Text>
            return <Text key={`r${i}`} dimColor>░</Text>
          }
          const label = pct === undefined ? '기록 없음' : `약 ${pct}%`
          const eta =
            avg === undefined
              ? `${fmt(job.seconds)} 경과 · 한 번 끝나면 다음부터 % 표시`
              : job.seconds < avg
                ? `${fmt(job.seconds)} 경과 · 남은 시간 약 ${fmt(avg - job.seconds)} (평균 ${fmt(avg)})`
                : `${fmt(job.seconds)} 경과 · 평균 ${fmt(avg)} 초과`
          return (
            <Box key={`j${job.pid}`} flexDirection="column" rowGap="xs">
              <Text bold color="cyan">▶ {job.kind}</Text>
              <Box flexDirection="row">
                {Array.from({ length: BAR }, (_, i) => cell(i))}
                <Text bold>
                  {'  '}
                  {label}
                </Text>
              </Box>
              <Text dimColor>⏱ {eta}</Text>
              <Text dimColor>{job.command.slice(0, width)}</Text>
            </Box>
          )
        })}

        <Box marginTop={1}>
          <Text bold>에이전트</Text>
        </Box>
        {shown.length === 0 && <Text dimColor>세션 없음</Text>}
        {guided(shown, false)}
        {!shown.some(x => x.isSelf) && subRows()}

        {/* 소제목 전체를 누르면 아래로 펼침·접힘
            ponytail: 데스크톱은 Button 을 네이티브 버튼(안쪽 여백, 굵기 무시)으로 그려 다른 소제목과 미세하게 어긋남 — 여백·굵기 props 생기면 맞춤 */}
        {/* 에이전트 목록과 숨겨진 에이전트 구분 가이드선 */}
        <Box marginTop={1}>
          <Text dimColor wrap="truncate">{'─'.repeat(width)}</Text>
        </Box>
        {/* 펼쳤을 때 제목과 첫 에이전트 사이 간격 */}
        <Box marginBottom={opened.includes(HIDDEN_SEC) ? 'md' : undefined}>
          <Button key="sec-hidden" plain onPress={() => void update($, expanded, l => toggle(l, HIDDEN_SEC))}>
            <Text bold>{`숨겨진 에이전트 (${stashed.length})`}</Text>
          </Button>
        </Box>
        {opened.includes(HIDDEN_SEC) && stashed.length === 0 && <Text dimColor>숨긴 에이전트 없음</Text>}
        {opened.includes(HIDDEN_SEC) && guided(stashed, true)}
        </Box>
        )}

        {view === 'history' && (
        <Box flexDirection="column" rowGap="sm">
        {hist.length === 0 && <Text dimColor>완료 기록 없음</Text>}
        {hist.map(x => (
          // 1줄: ✔ 작업 설명 / 2줄: 소요 시간 · 도구 수 · 단계 수
          <Box key={x.id} flexDirection="column" rowGap="xs">
            <Box flexDirection="row">
              <Text color={mix(0)}>✔ </Text>
              {title(`h:${x.id}`, x.prompt.trim(), x.label ? clip(x.label, 30) : fallback(x.prompt), true)}
            </Box>
            {detail(`h:${x.id}`, x.prompt.trim(), x.label ? clip(x.label, 30) : fallback(x.prompt))}
            {/* 펼쳤을 때: 고친 파일이 있으면 롤백 버튼 (두 번 눌러 확인) */}
            {opened.includes(`h:${x.id}`) && !x.rolledBack && (x.files?.length ?? 0) > 0 && (
              <Box flexDirection="row">
                <Text>{'    '}</Text>
                {controls(`rb:${x.id}`, '이 작업 전으로 롤백')}
              </Box>
            )}
            <Text dimColor>
              {'  └ '}
              {x.rolledBack ? '↩ 롤백됨 · ' : ''}
              {x.rid ? `#${x.rid} · ` : ''}
              {dur((x.endedAt ?? x.now) - x.startedAt)} · 도구 {x.tools}회
              {x.tasks.length ? ` · ${x.tasks.length}단계` : ''}
              {x.files?.length ? ` · 파일 ${x.files.length}개` : ''}
            </Text>
          </Box>
        ))}
        </Box>
        )}
      </Box>
    )
  })
}

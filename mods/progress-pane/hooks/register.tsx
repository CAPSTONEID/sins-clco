import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren, Timer } from 'claude-code'

import type { AgentRow, FileSnap, Jev, Lead, LogLine, RenderJob, Run, SubStat, Task } from '../types'
import { hcTitleStatus, newSubs, parseHc, toggle } from './agents'
import { jevKind, parseJev, SHARP } from './jev'
import { fmt, parsePs } from './render'
import { argOf, ARROW_ROWS, arrowRows, cardBar, DONE, dots, effortBar, FAIL, famColor, FLOW, forkLine, hms, kTok, layout, logText, NEON, shortTool, spin } from './flow'
import { planRollback, shortId, SNAP_MAX } from './rollback'
import { BAR, clip, dur, fallback, mix, shortModel } from './run'

const PANE = 'progress'
const TITLE = '진행 상황'
const HISTORY_MAX = 30

// 작업 진행 바: 지금 턴, 완료 기록(최신이 앞, 세션 동안 유지)
const run = atom({ plugin: 'progress-pane', key: 'run' } as const, null as Run | null)
const runs = atom({ plugin: 'progress-pane', key: 'runs' } as const, [] as Run[])
// 단계 목록(steps 도구): 턴·세션이 끝나도 유지, [×](/steps-clear)로 비움. 다 끝난 목록은 다음 입력 때 비움. 프로젝트 폴더별로 $.store 에 저장
// ponytail: 같은 폴더의 다른 세션과 저장 칸을 공유 — 동시 작업이 잦으면 세션 id 를 키에 섞기
const steps = atom({ plugin: 'progress-pane', key: 'steps' } as const, [] as Task[])
const stepsKey = async ($: EngineInterface) => `steps:${await $.session.root()}`
// 새 단계 목록에 시작·완료 시각을 붙임: 같은 이름(없으면 같은 자리)의 이전 시각을 이어 받고,
// 처음 진행 중·완료가 되는 순간 now 를 찍음. 진행 중을 건너뛰고 바로 완료된 단계는 앞 단계가 끝난 때부터로 셈
export function timeSteps(prev: readonly Task[], list: readonly Task[], now: number): Task[] {
  let lastEnd: number | undefined
  return list.map((t, i) => {
    const old = prev.find(p => p.subject === t.subject) ?? (prev[i]?.subject === t.subject ? prev[i] : undefined)
    let startedAt = old?.startedAt
    let endedAt = t.status === 'completed' ? old?.endedAt : undefined
    if (t.status !== 'pending') startedAt ??= t.status === 'completed' ? (lastEnd ?? now) : now
    if (t.status === 'completed') endedAt ??= now
    if (t.status === 'pending') startedAt = undefined
    if (endedAt !== undefined) lastEnd = Math.max(lastEnd ?? 0, endedAt)
    return { ...t, ...(startedAt !== undefined && { startedAt }), ...(endedAt !== undefined && { endedAt }) }
  })
}
// 모든 단계가 완료된 목록 — 다음 입력이 오면 새 작업으로 보고 비움 (진행 중인 목록은 다음 턴까지 이어감)
export const isAllDone = (list: readonly Task[]) => list.length > 0 && list.every(t => t.status === 'completed')
async function saveSteps($: EngineInterface, list: Task[]) {
  await update($, steps, () => list)
  const k = await stepsKey($)
  await (list.length ? $.store.set(k, list) : $.store.delete(k))
}
// 렌더 진행: 지금 돌고 있는 렌더, 종류별 과거 소요 시간(초, $.store 'render-history' 에도 저장)
// 이 창에는 그리지 않음 — usage-band 가 게이지 옆에 렌더 진행을 그릴 때 읽음
const jobs = atom({ plugin: 'progress-pane', key: 'jobs' } as const, [] as RenderJob[])
const renderHistory = atom({ plugin: 'progress-pane', key: 'renderHistory' } as const, {} as Record<string, number[]>)
// 에이전트 관제: 서브에이전트, 종료 확인 대기 항목
const agents = atom({ plugin: 'progress-pane', key: 'agents' } as const, [] as AgentRow[])
const subMeta = atom({ plugin: 'progress-pane', key: 'subMeta' } as const, {} as Record<string, { model: string; effort?: string }>)
const subStats = atom({ plugin: 'progress-pane', key: 'subStats' } as const, {} as Record<string, SubStat>)
// 서브에이전트 작업 상태 실시간 집계 — 도구 호출마다 여기만 고치고, 창 기록은 3초 폴링 때 한 번
// ponytail: 다시 로드되면 session.start 에서 마지막 기록으로 이어 붙임(그 사이 몇 초 분 도구 수는 빠질 수 있음)
const stats = new Map<string, SubStat>()
// Agent 호출의 추론값(effort) — 같은 호출의 agent.spawn 에서 서브에이전트 id 와 짝지음
const efforts = new Map<string, string>()
const confirm = atom({ plugin: 'progress-pane', key: 'confirm' } as const, null as string | null)
// 제목을 눌러 전체 내용을 펼친 항목 키
const expanded = atom({ plugin: 'progress-pane', key: 'expanded' } as const, [] as string[])
// 보고 있는 탭: 진행(흐름도) / 완료 기록
const tab = atom({ plugin: 'progress-pane', key: 'tab' } as const, 'now' as 'now' | 'history')
// 흐름도: 세션 로그, 메인 루프 상태(모델·effort·컨텍스트·advisor)
const log = atom({ plugin: 'progress-pane', key: 'log' } as const, [] as LogLine[])
const lead = atom({ plugin: 'progress-pane', key: 'lead' } as const, null as Lead | null)
// 마지막 Jev(jev.py route/review) 결과 — 흐름도 메인 상자 아래 Jev 상자
const jev = atom({ plugin: 'progress-pane', key: 'jev' } as const, null as Jev | null)
// 세션 로그 버퍼 — 메인 도구는 바로 창에 반영, 서브에이전트 도구는 3초 폴링 때 반영
const LOG_MAX = 6
// 세션 로그 모델 칸 폭('haiku 5.5' 9칸)
const LOG_MODEL_W = 9
const logBuf: LogLine[] = []
const pushLog = (l: LogLine) => {
  logBuf.push(l)
  if (logBuf.length > LOG_MAX) logBuf.splice(0, logBuf.length - LOG_MAX)
}
// 흐름도에 그릴 서브에이전트 카드 최대 수
const CARD_MAX = 6
// 제목 옆 작은 버튼 아이콘 (확인 단계의 '정말 종료'·'취소'는 글자 그대로)
const ICON: Record<string, string> = { 종료: '✕' }
const LIVE = new Set(['pending', 'running', 'waiting', 'idle'])

// 끝난 작업을 haiku로 15자 안팎 한 줄 설명으로 요약해 기록에 붙임
async function summarize($: EngineInterface, r: Run) {
  const steps = r.tasks.map(t => `- ${t.subject}`).join('\n')
  const res = await $.model.complete({
    model: 'haiku',
    system: '사용자 요청과 수행 단계를 보고, 한 작업을 10자 이내의 한국어 명사구로 요약한다. 따옴표·마침표·이모지 없이 한 줄만 출력한다. 예: 카드뉴스 설계, 게이지 구분선',
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

// 상태줄 한 줄 요약은 끔 — 같은 내용이 usage-band 게이지 옆 칸에 이미 표시됨
async function refreshStatus($: EngineInterface): Promise<void> {
  $.ui.status(undefined)
}

// 이 세션의 sessionId — 롤백 사본 폴더 이름
let self = ''
// herdr 안이면 이 터미널 주소($HC_TERMINAL_ID) — hc 서브에이전트를 찾는 기준, 밖이면 ''
let hcSelf = ''
// 값이 실제로 바뀔 때만 기록 → 창을 다시 그림. 3초 폴링이 매번 새 배열을 써서 창이 계속 다시 그려지면
// 그리는 순간 누른 클릭이 이전 그림의 버튼으로 가서 사라짐(가끔 여러 번 눌러야 열리던 원인)
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

// 서브에이전트 목록 갱신
async function pollAgents($: EngineInterface) {
  try {
    const list = await $.agent.list()
    // Agent 도구 서브에이전트 + herdr(hc run --bg) 서브에이전트를 한 목록으로
    const hcRows = hcSelf ? parseHc((await $.process.run(['hc', 'ls']).catch(() => ({ stdout: '' }))).stdout, hcSelf) : []
    // 상태가 안 나온(idle) hc 서브에이전트는 hc get 의 창 제목으로 작업 중·완료를 추정
    // ponytail: 3초마다 idle 인 hc 서브에이전트 수만큼 hc get 실행 — 수십 개 띄우면 hc ls 에 제목이 생길 때 한 번으로 줄이기
    const hc = await Promise.all(
      hcRows.map(async a => {
        if (a.status !== 'idle') return a
        const got = await $.process.run(['hc', 'get', a.id.slice(3)]).catch(() => ({ stdout: '' }))
        let title: unknown
        try {
          title = (JSON.parse(got.stdout) as { title?: unknown }).title
        } catch {
          // 못 읽으면 idle 그대로
        }
        return { ...a, status: hcTitleStatus(title) ?? a.status }
      }),
    )
    const v = [...list.map(a => ({ id: a.id, type: a.type, description: a.description, status: a.status })), ...hc]
    const prev = await read($, agents)
    if (!same(prev, v)) {
      await update($, agents, () => v)
      // 지금 작업 중에 새로 나타난 서브에이전트는 그 작업에 기록 (완료 기록에서 다시 보기용)
      const born = newSubs(prev, v)
      if (born.length) await update($, run, r => (r && !r.endedAt ? { ...r, subs: [...new Set([...(r.subs ?? []), ...born])] } : r))
    }
    const now = await $.clock.now()
    for (const a of list) {
      const st = stats.get(a.id)
      if (st && !st.endedAt && !LIVE.has(a.status)) stats.set(a.id, { ...st, endedAt: now })
    }
    const s = Object.fromEntries(stats)
    // 실행 중인 서브에이전트가 있으면 경과 시간이 바뀌므로 기록(3초마다 한 번 다시 그림)
    if (list.some(a => a.status === 'running') || !same(await read($, subStats), s)) await update($, subStats, () => s)
    if (!same(await read($, log), logBuf)) await update($, log, () => [...logBuf])
  } catch {
    // 목록을 못 받으면 이전 값 유지
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

// 롤백(rb:), hc 서브에이전트는 hc kill, 그 외 서브에이전트는 TaskStop
async function stop($: EngineInterface, key: string) {
  await update($, confirm, () => null)
  try {
    if (key.startsWith('rb:')) {
      await rollback($, key.slice(3))
    } else if (key.startsWith('a:hc:')) {
      const r = await $.process.run(['hc', 'kill', key.slice(5)])
      $.ui.toast(r.exitCode === 0 ? 'hc 서브에이전트를 종료했습니다' : `종료 실패: ${(r.stderr || r.stdout).trim().slice(0, 120)}`)
    } else if (key.startsWith('a:')) {
      await $.tool.call({ tool: 'TaskStop', task_id: key.slice(2) })
      $.ui.toast('서브에이전트를 종료했습니다')
    }
  } catch (err) {
    $.ui.toast(`실패: ${String(err).slice(0, 120)}`)
  }
  await pollAgents($)
}

export const register: Register = on => {
  let tick: Timer | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'progress', description: '진행 상황 창 열기' })
    await $.command.register({ name: 'steps-clear', description: '프롬프트 위 단계 목록 비우기' })
    await $.command.register({ name: 'progress-toggle', description: '진행 상황 창 열기/닫기 전환' })
    const savedSteps = await $.store.get(await stepsKey($))
    if (Array.isArray(savedSteps)) await update($, steps, () => savedSteps as Task[])
    // 이 빌드엔 TodoWrite·TaskCreate 가 없어 단계 줄 데이터를 모델이 직접 보내는 도구를 등록
    await $.tool.register({
      name: 'steps',
      description:
        '여러 단계 작업의 진행 단계를 프롬프트 위 단계 목록(한 단계 한 줄, ✔ 완료 · ◐ 진행 중 · ◌ 대기)에 표시한다. 3단계 이상 작업을 시작할 때 전체 단계를 보내고, 단계가 시작·완료될 때마다 전체 목록을 상태와 함께 다시 보낸다. 단계 이름은 2~8자 한국어 명사구.',
      inputSchema: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                subject: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
              },
              required: ['subject', 'status'],
            },
          },
        },
        required: ['steps'],
      },
      isDeferred: false,
    })

    const savedHistory = (await $.store.get('render-history')) as Record<string, number[]> | undefined
    if (savedHistory) await update($, renderHistory, () => savedHistory)
    for (const [id, st] of Object.entries(await read($, subStats))) if (!stats.has(id)) stats.set(id, st)
    // 다시 로드되면 모듈 버퍼가 비므로 창에 남은 로그로 이어 붙임
    if (!logBuf.length) logBuf.push(...(await read($, log)))

    // 옆 패널은 자동으로 열지 않음 — 진행 상황은 usage-band 게이지 옆 칸에 표시, 창은 /progress 로 수동 열기

    self = await $.session.id().catch(() => '')
    hcSelf = (await $.env.get('HC_TERMINAL_ID').catch(() => undefined)) ?? ''
    // ponytail: 3일 지난 세션의 스냅샷 폴더 정리, 세션이 3일 넘게 이어지면 그 세션 롤백도 사라짐
    void $.process
      .run(['find', SNAP_ROOT, '-mindepth', '1', '-maxdepth', '1', '-mtime', '+3', '-exec', 'rm', '-rf', '{}', '+'])
      .catch(() => undefined)
    void pollAgents($)

    // 3초마다 ps 로 렌더 프로세스 확인(usage-band 표시용) + 서브에이전트 목록·상태 갱신
    // ponytail: ps 폴링이라 진행률(%)은 모름, 평균 소요 시간으로 ETA 추정
    $.clock.every(3000, async () => {
      try {
        const { stdout } = await $.process.run(['ps', '-axo', 'pid=,ppid=,etime=,command='])
        const found = parsePs(stdout)
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
      } catch {
        // ps 실패 시 이전 값 유지
      }
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

  // 메인 루프 요청마다: 실제 모델·effort·컨텍스트 토큰, advisor 서버 도구 호출 수 기록
  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    if (e.agentId) return r
    try {
      const adv = (r.serverToolUses ?? []).filter(u => u.name === 'advisor')
      const u = r.usage
      const ctx = u ? u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens : undefined
      await update($, lead, l => ({
        model: u?.model ?? e.model,
        effort: e.effort,
        ctx: ctx ?? l?.ctx ?? 0,
        advisor: (l?.advisor ?? 0) + adv.length,
        advisorAt: adv.length ? adv[adv.length - 1]!.startedAt : l?.advisorAt,
      }))
    } catch {
      // 기록 실패해도 응답은 그대로
    }
    return r
  })

  on('command.run', { command: 'steps-clear' }, async $ => {
    await saveSteps($, [])
    return { text: '단계 목록을 비웠습니다.' }
  })

  // 막대의 ‣ 버튼: 창이 열려 있으면 닫고, 없으면 연다
  on('command.run', { command: 'progress-toggle' }, async $ => {
    const isOpen = (await $.ui.panes()).some(p => p.id === PANE)
    if (isOpen) await $.ui.close({ id: PANE })
    else await $.ui.open({ id: PANE, title: TITLE, backgroundColor: NEON.bg })
    await refreshStatus($)
    return { text: isOpen ? '진행 상황 창을 닫았습니다.' : '진행 상황 창을 열었습니다.' }
  })

  on('command.run', { command: 'progress' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE, backgroundColor: NEON.bg })
    await refreshStatus($)
    return { text: '진행 상황 창을 열었습니다.' }
  })

  // 턴 시작: 진행 바 초기화 + 1초마다 경과 시간 갱신
  on('turn.start', async ($, e, next) => {
    // 서브에이전트 턴은 메인 작업 진행을 덮어쓰지 않음 (turn.complete 와 같은 기준)
    if (e.agentId) return next(e)
    tick?.cancel()
    if (isAllDone(await read($, steps))) await saveSteps($, [])
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
    await pollAgents($)
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
    // 세션 로그: 메인은 바로 창에, 서브에이전트는 버퍼에만(3초 폴링 때 반영)
    pushLog({
      t: await $.clock.now(),
      model: e.agentId ? ((await read($, subMeta))[e.agentId]?.model ?? 'sub') : ((await read($, lead))?.model ?? 'main'),
      sub: !!e.agentId,
      tool: shortTool(e.tool),
      arg: argOf(e as unknown as Record<string, unknown>),
    })
    if (!e.agentId) await update($, log, () => [...logBuf])
    // 서브에이전트 도구: 메모리에만 세고 창은 3초 폴링 때 반영
    if (e.agentId) {
      const st = stats.get(e.agentId) ?? { startedAt: await $.clock.now(), tools: 0, lastTool: '' }
      stats.set(e.agentId, { ...st, tools: st.tools + 1, lastTool: e.tool })
    }
    return ran
  }).catch(($, e, next) => next(e))

  // 롤백용 원본 사본: 서브에이전트가 고친 파일도 지금 작업에 포함. 실패해도 도구는 그대로 실행
  // Jev 실행 감지: Bash 로 jev.py route/review 를 돌리면 실행 중 표시 → 끝나면 출력(JSON)을 읽어 Jev 상자에 기록
  // .catch 로 next 를 다시 부르지 않음 — 기록 실패로 명령이 두 번 실행되면 안 되므로 기록만 try 로 감쌈
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const kind = jevKind(e.command)
    if (!kind) return next(e)
    try {
      const t = await $.clock.now()
      await update($, jev, j => ({ ...(j ?? { kind, count: 0, rows: [] }), t, running: true }))
    } catch {
      // 표시 실패해도 명령은 그대로
    }
    const ran = await next(e)
    try {
      const t = await $.clock.now()
      await update($, jev, j => parseJev(kind, ran.text ?? '', t, (j?.count ?? 0) + 1))
    } catch {
      // 기록 실패해도 결과는 그대로
    }
    return ran
  })

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

  // 단계 도구: 받은 전체 목록으로 할 일 목록 교체 (메인 루프만)
  // 엔진은 매처 없는 tool.call 을 모듈당 하나만 받음 → 매처 사용. 등록 도구 이름이 타입에 없어 e 는 직접 형 지정
  on('tool.call', { tool: 'mcp__progress-pane__steps' }, async ($, ev) => {
    const e = ev as unknown as { agentId?: string; steps?: { subject?: unknown; status?: unknown }[] }
    const list = e.steps
    if (!Array.isArray(list)) return { deny: 'steps 배열이 필요합니다' }
    const ok = new Set(['pending', 'in_progress', 'completed'])
    if (!e.agentId) {
      const tasks = list.map((t, i) => ({
        id: `step-${i}`,
        subject: String(t.subject ?? ''),
        status: (ok.has(String(t.status)) ? t.status : 'pending') as Task['status'],
      }))
      const timed = timeSteps(await read($, steps), tasks, await $.clock.now())
      await setTasks($, () => timed)
      await saveSteps($, timed)
    }
    return { result: `단계 ${list.length}개 표시` }
  }).catch(($, e, next) => next(e))

  // 시스템 프롬프트에 단계 도구 사용 규칙 추가 (그 도구가 있는 루프에만)
  on('prompt.compose', async ($, e, next) => {
    const r = await next(e)
    if (!e.tools.includes('mcp__progress-pane__steps')) return r
    return {
      sections: [
        ...r.sections,
        {
          id: 'progress-pane:steps',
          scope: 'session',
          text: [
            '# 진행 단계 표시',
            '3단계 이상으로 나뉘는 작업은 첫 도구 호출 전에 mcp__progress-pane__steps 로 전체 단계를 보낸다(첫 단계 in_progress, 나머지 pending).',
            '단계가 끝나고 다음 단계로 넘어갈 때마다 전체 목록을 상태와 함께 다시 보낸다. 작업이 끝나면 모든 단계를 completed 로 보낸다.',
            '단계 이름은 8자 이내의 한국어 명사구로 쓴다(예: 코드 확인, 테스트·푸시). 질문 답변·한두 번 도구 호출로 끝나는 일에는 쓰지 않는다.',
          ].join('\n'),
        },
      ],
    }
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const r = await read($, run)
    const hist = await read($, runs)
    const subs = await read($, agents)
    const meta = await read($, subMeta)
    const subStat = await read($, subStats)
    const now = await $.clock.now()
    const asking = await read($, confirm)
    const opened = await read($, expanded)
    const view = await read($, tab)
    const L = await read($, lead)
    const logs = await read($, log)
    const J = await read($, jev)
    // 네온 다크: 창 전체 바탕을 다크 네이비로, 글자는 모두 색을 직접 지정(기본 글자색은 밝은 테마용이라 어두움)
    const { fg: FG, muted: MUTED, subtle: SUBTLE, warn: WARN, bg: BG, chip: CHIP, cyan: CYAN } = NEON
    // 버튼은 글자색을 못 정해서 밝은 칩 위에 올림(어두운 버튼 글자가 다크 바탕에서도 보이게)
    const chip = (key: string, node: RenderChildren, bg: string = CHIP) => (
      <Box key={`chip:${key}`} backgroundColor={bg} flexShrink={0}>
        {node}
      </Box>
    )

    // 잘린 제목은 누를 수 있는 버튼, 누르면 아래에 전체 내용 펼침 · 다시 누르면 접힘
    // 안 잘린 제목은 그냥 글자
    // 다크 바탕에선 버튼 글자가 안 보여서 제목은 글자로, 펼치기는 옆의 작은 칩(▸/▾)
    const title = (key: string, full: string, short: string, always = false) =>
      short === full && !always ? (
        <Text color={FG}>{full}</Text>
      ) : (
        <Box key={`tt:${key}`} flexDirection="row">
          <Text color={FG} bold>{short}</Text>
          <Box marginLeft={1}>
            {chip(
              `t:${key}`,
              <Button
                key={`t:${key}`}
                plain
                label={opened.includes(key) ? '▾' : '▸'}
                onPress={() => {
                  void update($, expanded, l => toggle(l, key))
                  // 접거나 펼 때 '정말 종료' 대기 해제 — 다시 펼쳤을 때 한 번 클릭으로 실행되지 않게
                  void update($, confirm, () => null)
                }}
              />,
            )}
          </Box>
        </Box>
      )
    // 펼친 전체 내용 — 공백 대신 상자 여백으로 들여씀(데스크톱 글꼴에선 공백이 거의 안 보임)
    const detail = (key: string, full: string, short: string) =>
      short !== full && opened.includes(key) ? (
        <Box paddingLeft={4}>
          <Text color={CYAN}>{`‣ ${full.slice(0, 1000)}`}</Text>
        </Box>
      ) : null
    const width = Math.max(20, (e.props.bodyColumns ?? 40) - 2)

    // 작업 진행 바: 할 일 목록 있으면 완료 비율, 없으면 움직이는 6칸 블록
    const controls = (key: string, verb = '종료') =>
      asking === `${key}#${verb}` ? (
        <Box key={`${key}-c`} flexDirection="row" columnGap={1}>
          {chip(`${key}-ok`, <Button key={`${key}-ok`} variant="primary" onPress={() => void stop($, key)}>{`정말 ${verb}`}</Button>)}
          {chip(`${key}-no`, <Button key={`${key}-no`} onPress={() => void update($, confirm, () => null)}>취소</Button>)}
        </Box>
      ) : (
        // 크기 설정이 없어 한 글자 아이콘으로 작게 — label 을 주면 데스크톱이 label 글자를 그려서 아이콘만 둠
        chip(
          `${key}-x`,
          <Button key={`${key}-x`} plain onPress={() => void update($, confirm, () => `${key}#${verb}`)}>
            {ICON[verb] ?? verb}
          </Button>,
        )
      )

    // 서브에이전트 한 행(메인 에이전트 아래 xl 여백만큼 들여쓰기) — 1줄: 아이콘 + 'sub । ' + 작업 설명 + 모델 + 작은 종료 버튼(실행 중일 때) / 2줄: 상태 · 경과 · 도구
    const sub = (a: (typeof subs)[number]) => {
      const key = `a:${a.id}`
      const live = LIVE.has(a.status)
      return (
        // 들여쓰기는 공백 대신 상자 여백 — 데스크톱 글꼴에선 공백이 좁아 거의 안 보임
        <Box key={key} flexDirection="column" rowGap={0} paddingLeft={4}>
          <Box flexDirection="row">
            <Text color={live ? CYAN : MUTED}>
              {a.status === 'running' ? '► ' : live ? '● ' : '○ '}
            </Text>
            <Text color={FG}>{a.type === 'hc' ? 'hc । ' : 'sub । '}</Text>
            {a.type === 'hc' ? (
              // hc 서브에이전트: 이름 옆 ⧉ 칩을 누르면 그 터미널로 들어가는 명령 복사
              <Box flexDirection="row">
                <Text color={FG} bold>{clip(a.description, 22)}</Text>
                <Box marginLeft={1}>
                  {chip(
                    `t:${key}`,
                    <Button
                      key={`t:${key}`}
                      plain
                      label="⧉"
                      onPress={press => {
                        const cmd = `hc attach ${a.id.slice(3)}`
                        void $.ui.copy({ text: cmd, surface: press.surface }).then(() => $.ui.toast(`${cmd} 복사됨`)).catch(() => undefined)
                      }}
                    />,
                  )}
                </Box>
              </Box>
            ) : (
              title(key, a.description, clip(a.description, 22))
            )}
            {meta[a.id] && (
              <Text color={MUTED}>{`  । ${shortModel(meta[a.id]!.model)} · ${meta[a.id]!.effort ?? '기본'}`}</Text>
            )}
            {/* hc 서브에이전트는 완료돼도 터미널이 살아 있으면 종료(hc kill) 가능 */}
            {(live || a.type === 'hc') && (
              <Box marginLeft={1}>
                {controls(key)}
              </Box>
            )}
          </Box>
          {detail(key, a.description, clip(a.description, 22))}
          <Text color={MUTED}>
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

    // ── 흐름도: 메인 세션 → 위임 → 서브에이전트 카드 → 리드 복귀, 아래 세션 로그 ──
    // 애니메이션 박자는 1초 — 턴 중엔 1초 타이머, 서브에이전트만 돌 땐 3초 폴링이 다시 그림
    const phase = Math.floor(now / 1000)
    // 다크 화면 안쪽 폭(좌우 여백 1칸씩)
    const fw = width - 2
    // 날짜 꼬리(-20261001)를 뗀 짧은 모델 이름
    const nm = (m: string) => shortModel(m.replace(/-\d{8}$/, ''))
    const leadModel = L?.model ?? ''
    const leadName = leadModel ? nm(leadModel) : 'main'
    const leadColor = famColor(leadModel)
    const active = !!r && !r.endedAt
    // 카드: 살아 있는 서브에이전트 + 지금(없으면 직전) 작업이 띄운 서브에이전트
    const pool = new Set(r?.subs ?? hist[0]?.subs ?? [])
    const cards = subs.filter(a => LIVE.has(a.status) || pool.has(a.id)).slice(-CARD_MAX)
    const running = cards.filter(a => a.status === 'running').length
    const allDone = cards.length > 0 && cards.every(a => !LIVE.has(a.status))
    const subModels = [...new Set(cards.flatMap(a => (meta[a.id] ? [nm(meta[a.id]!.model)] : [])))]
    const subColor = famColor(subModels[0] ?? 'haiku')
    const { per, cw } = layout(cards.length, fw)
    const lineW = cards.length ? per * cw + per - 1 : fw
    const pad = (w: number) => ' '.repeat(Math.floor(w / 2))

    // 세로 연결선 3줄 — 흐를 땐 ▼가 1→2→3번째 줄로 차례로 내려가고 나머지 줄은 선(│), 쉴 땐 어두운 점선
    const vline = (key: string, lit: boolean, color: string) =>
      Array.from({ length: ARROW_ROWS }, (_, i) => (
        <Box key={`${key}${i}`} flexDirection="row">
          <Text>{pad(lineW)}</Text>
          <Text color={lit ? color : SUBTLE}>{lit ? (phase % ARROW_ROWS === i ? FLOW : '│') : '┊'}</Text>
        </Box>
      ))
    // 가로 갈래선 — 흐를 땐 작은 원 • 두 개가 가운데에서 카드 쪽으로 퍼짐(outward) 또는 카드에서 가운데로 모임
    const runLine = (key: string, line: string, lit: boolean, color: string, outward: boolean) => (
      <Box key={key} flexDirection="row">
        {(lit ? dots(line, phase, outward) : ([[line, false]] as [string, boolean][])).map(([s, hot], i) => (
          <Text key={`${key}${i}`} color={hot ? color : lit ? MUTED : SUBTLE} bold={hot}>{s}</Text>
        ))}
      </Box>
    )

    // 범례: ■ 모델 · 역할
    const legendItems: [string, string, string][] = [
      [leadName, 'lead', leadColor],
      ...subModels.filter(m => m !== leadName).map(m => [m, 'swarm', famColor(m)] as [string, string, string]),
      ...(L?.advisor ? [['advisor', 'on call', famColor('opus')] as [string, string, string]] : []),
      ...(J ? [['jev', J.kind === 'review' ? 'review' : 'route', DONE] as [string, string, string]] : []),
    ]
    const legend = (
      <Box key="legend" flexDirection="row" columnGap={2} flexWrap="wrap">
        {legendItems.map(([name, role, color]) => (
          <Box key={`lg:${name}`} flexDirection="row">
            <Text color={color}>■ </Text>
            <Text color={MUTED}>{`${name} · ${role}`}</Text>
          </Box>
        ))}
      </Box>
    )

    // 메인 세션 상자 — 작업 중이면 모델 색 테두리 + 깜빡이는 ●
    const elapsed = r ? r.now - r.startedAt : 0
    const total = r?.tasks.length ?? 0
    const doneN = r?.tasks.filter(t => t.status === 'completed').length ?? 0
    const step = r?.tasks.find(t => t.status === 'in_progress')
    const barW = Math.max(8, Math.min(BAR, fw - 20))
    const filled = total ? Math.round((doneN / total) * barW) : 0
    const cell = (i: number) => {
      if (i < filled) return <Text key={`c${i}`} color={mix(i / barW)}>█</Text>
      if (active && !total && (i - (phase % barW) + barW) % barW < 6) return <Text key={`c${i}`} color={mix(i / barW)}>▓</Text>
      return <Text key={`c${i}`} color={SUBTLE}>░</Text>
    }
    const last = hist[0]
    const mainBox = (
      <Box key="main" flexDirection="column" borderStyle="bold" borderColor={active ? leadColor : SUBTLE} paddingX={1} width={fw}>
        <Text bold color={leadColor} wrap="truncate">{`${active && phase % 2 ? '●' : '○'} ${leadName.toUpperCase()} · MAIN SESSION`}</Text>
        {r ? (
          // 다크 화면에선 버튼 글자가 안 보여서 제목은 글자로만(전체 요청은 완료 기록 탭에서 펼쳐 봄)
          <Text color={FG} wrap="truncate">{`▸ ${fallback(r.prompt)}`}</Text>
        ) : (
          <Text color={MUTED} wrap="truncate">
            {last ? `대기 중 · 마지막: ${last.label ?? fallback(last.prompt)} · ${dur((last.endedAt ?? last.now) - last.startedAt)}` : '대기 중'}
          </Text>
        )}
        <Text color={MUTED} wrap="truncate">{`effort ${effortBar(L?.effort)}${L?.ctx ? ` · ctx ${kTok(L.ctx)}` : ''}`}</Text>
        {r && (
          <Box flexDirection="row">
            {Array.from({ length: barW }, (_, i) => cell(i))}
            <Text bold color={FG}>{`  ${total ? `${doneN}/${total} · ${Math.round((doneN / total) * 100)}%` : '진행 중'}`}</Text>
          </Box>
        )}
        {r && <Text color={MUTED} wrap="truncate">{`⏱ ${dur(elapsed)} · 도구 ${r.tools}회${r.lastTool ? ` · ${shortTool(r.lastTool)}` : ''}`}</Text>}
        {step && <Text color={leadColor} wrap="truncate">{`└ ${step.subject}`}</Text>}
      </Box>
    )

    // Jev 상자 — jev.py 를 한 번이라도 돌렸을 때만. 실행 중이거나 1분 안의 결과면 초록 테두리
    // route: 레인별 적합도 막대 + 추천·확신도(0.6 이상 sharp → 위임, 미만 split → 메인 판단)
    // review: 기준별 점수 막대(75 이상 초록) + 판정·총점
    // 오류는 1분 지나면 숨김(오래된 실패가 계속 남지 않게)
    const jevBox = J && !(J.kind === 'error' && !J.running && now - J.t > 60_000) && (() => {
      const fresh = J.running || now - J.t < 60_000
      const labW = Math.min(20, Math.max(6, ...J.rows.map(x => x.label.length + 1)))
      const barJ = Math.max(6, fw - 4 - labW - 6)
      const pass = J.kind === 'review' ? 0.75 : SHARP
      const sharp = (J.conf ?? 0) >= SHARP
      const conf = J.conf !== undefined ? ` · conf ${J.conf.toFixed(2)}` : ''
      return (
        <Box key="jev" flexDirection="column" borderStyle="bold" borderColor={fresh ? DONE : SUBTLE} paddingX={1} width={fw}>
          <Box flexDirection="row" justifyContent="space-between">
            <Text bold color={DONE}>{`JEV · ${J.kind.toUpperCase()}`}</Text>
            <Text color={MUTED}>{`calls ${J.count} · ${hms(J.t)}`}</Text>
          </Box>
          {J.running && <Text color={DONE}>{`${spin(phase)} 판정 중…`}</Text>}
          {!J.running &&
            J.rows.map((x, i) => {
              const fill = Math.round(Math.min(1, Math.max(0, x.p)) * barJ)
              const ok = x.p >= pass
              return (
                <Box key={`jr${i}`} flexDirection="row">
                  <Box width={labW} flexShrink={0}>
                    <Text color={FG} wrap="truncate" bold={J.kind === 'route' && x.label.startsWith(`${J.pick} `)}>{x.label}</Text>
                  </Box>
                  <Text color={ok ? DONE : WARN}>{'█'.repeat(fill)}</Text>
                  <Text color={SUBTLE}>{'░'.repeat(barJ - fill)}</Text>
                  <Text color={ok ? DONE : WARN}>{J.kind === 'review' ? ` ${String(Math.round(x.p * 100)).padStart(3)}` : ` ${x.p.toFixed(2)}`}</Text>
                </Box>
              )
            })}
          {!J.running && J.kind === 'route' && J.pick && (
            <Box flexDirection="row">
              <Text color={MUTED}>{`→ ${J.pick}${conf}  `}</Text>
              <Text bold color={sharp ? DONE : WARN}>{sharp ? 'sharp → 위임' : 'split → 메인 판단'}</Text>
            </Box>
          )}
          {!J.running && J.kind === 'review' && (
            <Box flexDirection="row">
              <Text color={MUTED}>{`→ ${J.score ?? '?'}점${conf}  `}</Text>
              <Text bold color={J.verdict === 'pass' ? DONE : WARN}>{J.verdict ?? '?'}</Text>
            </Box>
          )}
          {!J.running && J.note && <Text color={J.kind === 'error' ? FAIL : MUTED} wrap="truncate">{J.note}</Text>}
        </Box>
      )
    })()

    // advisor 서버 도구를 쓴 적 있을 때만 한 줄
    const advisor = L && L.advisor > 0 && (
      <Box key="adv" flexDirection="row">
        <Text color={famColor('opus')}>◆ ADVISOR · ON CALL</Text>
        <Text color={MUTED} wrap="truncate">{`  호출 ${L.advisor}회${L.advisorAt ? ` · 마지막 ${hms(L.advisorAt)}` : ''}`}</Text>
      </Box>
    )

    // 서브에이전트 카드 — 실행 중: 모델 색 테두리 + 흐르는 막대 + 스피너 / 완료: 초록 꽉 찬 막대
    // ponytail: 엔진이 진행률을 주지 않아 막대는 % 대신 실행 중 표시, 아래 줄에 경과·도구 수
    const iw = Math.max(4, cw - 4)
    const card = (a: AgentRow) => {
      const key = `a:${a.id}`
      const m = meta[a.id]?.model
      const st = subStat[a.id]
      const color = m ? famColor(m) : subColor
      const state = a.status === 'running' ? 'run' : a.status === 'completed' ? 'done' : 'idle'
      const bad = ['failed', 'killed', 'error', 'stopped'].includes(a.status)
      const live = LIVE.has(a.status)
      return (
        <Box
          key={key}
          flexDirection="column"
          borderStyle="bold"
          borderColor={bad ? FAIL : state === 'run' ? color : state === 'done' ? DONE : SUBTLE}
          paddingX={1}
          width={cw}
        >
          <Text bold color={FG} wrap="truncate">{clip(a.description, iw)}</Text>
          <Text color={color} wrap="truncate">{m ? nm(m) : a.type}</Text>
          <Box flexDirection="row">
            {cardBar(iw, phase, state).map((full, i) => (
              <Text key={`${key}b${i}`} color={full ? (state === 'done' ? DONE : color) : SUBTLE}>
                {full ? '█' : '░'}
              </Text>
            ))}
          </Box>
          <Box flexDirection="row">
            <Text
              color={bad ? FAIL : state === 'done' ? DONE : state === 'run' ? color : MUTED}
              wrap="truncate"
            >
              {bad ? `✕ ${a.status}` : state === 'done' ? '✓ done' : state === 'run' ? `${spin(phase)} running` : `○ ${a.status}`}
            </Text>
            {(live || a.type === 'hc') && <Box marginLeft={1}>{controls(key)}</Box>}
          </Box>
          {st && <Text color={MUTED} wrap="truncate">{`⏱ ${dur((st.endedAt ?? now) - st.startedAt)} · ${st.tools}회`}</Text>}
        </Box>
      )
    }

    // 리드 복귀 상자 — 카드가 모두 끝났고 작업이 이어지는 중이면 켜짐
    const backOn = allDone && active
    const back = (
      <Box key="back" flexDirection="row" justifyContent="center" width={lineW}>
        <Box flexDirection="column" alignItems="center" borderStyle="bold" borderColor={backOn ? leadColor : SUBTLE} paddingX={2}>
          <Text bold color={backOn ? leadColor : MUTED}>{`BACK TO ${leadName.toUpperCase()} · LEAD`}</Text>
          <Text color={MUTED}>review + verify</Text>
        </Box>
      </Box>
    )

    const flow = (
      <Box flexDirection="column" rowGap={0} paddingX={1} paddingTop={1} width={width}>
        {legend}
        {advisor}
        {mainBox}
        {vline('v1', active || running > 0, leadColor)}
        {jevBox}
        {jevBox && vline('vj', active || running > 0, DONE)}
        <Box flexDirection="row" justifyContent="center" width={lineW}>
          <Text color={cards.length ? FG : MUTED} wrap="truncate">DELEGATE → SUBAGENTS · </Text>
          <Text color={cards.length ? subColor : MUTED}>
            {cards.length ? subModels.join(', ') || 'sub' : '위임 없음'}
          </Text>
        </Box>
        {cards.length > 0 && runLine('f1', forkLine(per, cw, true), running > 0, subColor, true)}
        {cards.length > 0 &&
          arrowRows(per, cw, phase, running > 0).map((row, i) => (
            <Text key={`ar${i}`} color={running > 0 ? subColor : SUBTLE}>{row}</Text>
          ))}
        {cards.length > 0 && (
          <Box flexDirection="row" columnGap={1} flexWrap="wrap" width={lineW}>
            {cards.map(card)}
          </Box>
        )}
        {cards.length > 0 && runLine('f2', forkLine(per, cw, false), backOn, leadColor, false)}
        {cards.length > 0 && vline('v2', backOn, leadColor)}
        {cards.length > 0 && back}

        {/* 세션 로그 — 최근 도구 호출(아래가 최신), 실행 모델 색으로 */}
        <Box flexDirection="column" borderStyle="round" borderColor={SUBTLE} paddingX={1} width={fw} marginTop={1}>
          <Text bold color={MUTED}>SESSION LOG</Text>
          {logs.length === 0 && <Text color={MUTED}>기록 없음</Text>}
          {/* 한 줄 고정: 시간 । 모델 । 내역 — 시간·모델은 고정 폭(줄어들지 않음), 내역은 남는 폭에 맞춰 … 로 줄임 */}
          {logs.slice(-5).map((l, i) => (
            <Box key={`log${i}`} flexDirection="row">
              <Box flexShrink={0}>
                <Text color={MUTED}>{`${hms(l.t)} । `}</Text>
              </Box>
              <Box flexShrink={0}>
                <Text color={l.model === 'sub' || l.model === 'main' ? FG : famColor(l.model)}>
                  {clip(l.model === 'main' || l.model === 'sub' ? l.model : nm(l.model), LOG_MODEL_W - 1).padEnd(LOG_MODEL_W)}
                </Text>
              </Box>
              <Box flexShrink={0}>
                <Text color={MUTED}>{' । '}</Text>
              </Box>
              <Box flexShrink={1}>
                {/* 테두리·여백 4 + 시간 8 + 구분 3 + 모델 + 구분 3 을 뺀 폭 */}
                <Text color={FG} wrap="truncate">{logText(l.tool, l.arg, fw - 4 - 8 - 3 - LOG_MODEL_W - 3)}</Text>
              </Box>
            </Box>
          ))}
        </Box>
        {/* 하단 상태 줄 */}
        <Box flexDirection="row" columnGap={2} flexWrap="wrap">
          <Box flexDirection="row">
            <Text color={MUTED}>subagents </Text>
            <Text color={running ? subColor : SUBTLE}>{`[${running}/${cards.length}]`}</Text>
          </Box>
          <Box flexDirection="row">
            <Text color={MUTED}>{`${leadName} `}</Text>
            <Text color={active ? leadColor : SUBTLE}>{active ? '[working]' : '[idle]'}</Text>
          </Box>
          {L?.advisor ? (
            <Box flexDirection="row">
              <Text color={MUTED}>advisor </Text>
              <Text color={famColor('opus')}>{`[${L.advisor}]`}</Text>
            </Box>
          ) : null}
        </Box>
      </Box>
    )

    return (
      // 창 전체를 다크 네이비로 채움(창 높이만큼) · 왼쪽 디바이더와 붙지 않게 2칸 들여쓰기
      <Box flexDirection="column" paddingLeft={2} backgroundColor={BG} width={e.props.bodyColumns} minHeight={e.props.scroll?.bodyRows}>
        {/* 탭 위 구분 실선 */}
        <Text color={SUBTLE} wrap="truncate">{'─'.repeat(width)}</Text>
        {/* 탭: 칩 모양 — 보는 탭은 네온 시안, 다른 탭은 회청색 */}
        <Box flexDirection="row" columnGap={1}>
          {chip('tab-now', <Button key="tab-now" onPress={() => void update($, tab, () => 'now')}>진행</Button>, view === 'now' ? CYAN : MUTED)}
          {chip(
            'tab-history',
            <Button key="tab-history" onPress={() => void update($, tab, () => 'history')}>{`완료 기록 ${hist.length}`}</Button>,
            view === 'history' ? CYAN : MUTED,
          )}
        </Box>

        {view === 'now' && (
        <Box flexDirection="column" rowGap={0}>
        {/* 탭과 작업 진행 구분 실선 */}
        <Text color={SUBTLE} wrap="truncate">{'─'.repeat(width)}</Text>
        {flow}

        </Box>
        )}

        {view === 'history' && (
        <Box flexDirection="column" rowGap={0}>
        <Text color={SUBTLE} wrap="truncate">{'─'.repeat(width)}</Text>
        {hist.length === 0 && <Text color={MUTED}>완료 기록 없음</Text>}
        {hist.map(x => (
          // 1줄: ✔ 작업 설명 / 2줄: 소요 시간 · 도구 수 · 단계 수
          <Box key={x.id} flexDirection="column" rowGap={0}>
            <Box flexDirection="row">
              <Text color={mix(0)}>✔ </Text>
              {title(`h:${x.id}`, x.prompt.trim(), x.label ? clip(x.label, 30) : fallback(x.prompt), true)}
            </Box>
            {detail(`h:${x.id}`, x.prompt.trim(), x.label ? clip(x.label, 30) : fallback(x.prompt))}
            {/* 펼쳤을 때: 이 작업이 쓴 서브에이전트 중 아직 살아 있는 것 (모두 닫혔으면 아무것도 안 그림) */}
            {opened.includes(`h:${x.id}`) && subs.filter(a => x.subs?.includes(a.id)).map(sub)}
            {/* 펼쳤을 때: 고친 파일이 있으면 롤백 버튼 (두 번 눌러 확인) */}
            {opened.includes(`h:${x.id}`) && !x.rolledBack && (x.files?.length ?? 0) > 0 && (
              <Box flexDirection="row" paddingLeft={4}>
                {controls(`rb:${x.id}`, '이 작업 전으로 롤백')}
              </Box>
            )}
            <Text color={MUTED}>
              {'  └ '}
              {x.rolledBack ? '↩ 롤백됨 · ' : ''}
              {x.rid ? `#${x.rid} · ` : ''}
              {dur((x.endedAt ?? x.now) - x.startedAt)} · 도구 {x.tools}회
              {x.tasks.length ? ` · ${x.tasks.length}단계` : ''}
              {x.subs?.length ? ` · 서브 ${x.subs.length}개` : ''}
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

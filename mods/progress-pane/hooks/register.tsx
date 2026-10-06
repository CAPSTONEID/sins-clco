import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { RenderJob } from '../types'
import { average, fmt, parsePs } from './render'
import { STAGES, detect, project } from './stage'

const PANE = 'progress'
const TITLE = '진행 상황'
const jobs = atom({ plugin: 'progress-pane', key: 'jobs' } as const, [] as RenderJob[])
// 종류별 과거 렌더 소요 시간(초), 세션 넘어 $.store 에도 저장
const history = atom({ plugin: 'progress-pane', key: 'history' } as const, {} as Record<string, number[]>)
const current = atom({ plugin: 'progress-pane', key: 'project' } as const, '')
const stages = atom({ plugin: 'progress-pane', key: 'stages' } as const, {} as Record<string, number>)

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
  const list = await read($, jobs)
  const head = `${name} ${stage === undefined ? '단계 미지정' : `▶${STAGES[stage]}`}`
  const tail = list.length > 0 ? ` · 렌더 ${list.length}건 ${fmt(Math.max(...list.map(j => j.seconds)))}` : ''
  $.ui.status(`${head}${tail} · /progress`)
}

export const register: Register = on => {
  let root = ''

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'progress',
      description: '진행 상황 창 열기 (/progress 대본 처럼 단계 지정, project <이름>, clear)',
      argumentHint: '[단계|project 이름|clear]',
    })
    root = await $.session.cwd()

    const savedHistory = (await $.store.get('history')) as Record<string, number[]> | undefined
    const savedStages = (await $.store.get('stages')) as Record<string, number> | undefined
    const savedProject = (await $.store.get('project')) as string | undefined
    if (savedHistory) await update($, history, () => savedHistory)
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
        const saved = await update($, history, h => ({
          ...h,
          [job.kind]: [...(h[job.kind] ?? []), job.seconds].slice(-10),
        }))
        await $.store.set('history', saved)
      }

      // 렌더 목록이 바뀔 때만 다시 그림(경과 시간은 매번 바뀌므로 렌더 중엔 3초마다 갱신)
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

  // 도구 호출로 프로젝트 전환·단계 자동 전진 — 뒤로는 자동으로 안 감
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
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

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const name = await read($, current)
    const stage = (await read($, stages))[name]
    const list = await read($, jobs)
    const past = await read($, history)
    const width = Math.max(20, (e.props.bodyColumns ?? 40) - 2)

    return (
      <Box flexDirection="column">
        <Text bold>{name}</Text>
        <Box flexWrap="wrap">
          {STAGES.map((s, i) => (
            <Text
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
            <Box flexDirection="column" marginBottom={1}>
              <Text>
                {job.kind} · {fmt(job.seconds)} 경과
              </Text>
              <Text dimColor>{eta}</Text>
              <Text dimColor>{job.command.slice(0, width)}</Text>
            </Box>
          )
        })}
      </Box>
    )
  })
}

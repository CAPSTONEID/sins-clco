import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { TaskStatus } from '../types'

const tasks = atom({ plugin: 'task-progress-band', key: 'tasks' } as const, {} as Record<string, TaskStatus>)
const isHidden = atom({ plugin: 'task-progress-band', key: 'isHidden' } as const, false)
// ponytail: 작업 막대는 세션 전체 하나. 목록별 막대는 작업 metadata에 묶음 키가 생기면 추가

// Tasks 줄 그라디언트 [시작색, 끝색]: 진행 중 퍼플→핑크, 다 끝나면 초록
type Grad = readonly [string, string]
const TASKS: Grad = ['#8b5cf6', '#ec4899']
const DONE: Grad = ['#10b981', '#34d399']

// 표 한 줄: 모든 줄이 같은 열 폭을 써서 막대·숫자·초기화 시간이 세로로 정렬된다
type Row = { key: string; label: string; pct: number; grad: Grad; value: string; note: string; ticks: number }

// 데스크톱용 둥근 막대: 반투명 트랙이라 라이트·다크 테마 모두에서 보인다
// 채운 구간 = 가로 그라디언트 + 위쪽 광택 + 점무늬 질감, 끝에 은은한 빛번짐
// 막대 크기(CSS px): 짧고 두껍게. Svg 에 그대로 넘겨 늘어나거나 납작해지지 않게 함
const BAR_W = 120
const BAR_H = 10
const barSvg = (pct: number, [from, to]: Grad, ticks: number) => {
  const W = BAR_W
  const H = BAR_H
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
  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true) {
      const id = ran.result.task.id
      await update($, tasks, map => ({ ...map, [id]: 'pending' as TaskStatus }))
      await update($, isHidden, () => false)
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true && e.status !== undefined) {
      const { status, taskId } = e
      await update($, tasks, map => {
        // 모르는 id 는 무시: 없는 작업을 유령 항목으로 만들지 않는다
        if (!(taskId in map)) return map

        const { [taskId]: _gone, ...rest } = map

        return status === 'deleted' ? rest : { ...rest, [taskId]: status }
      })
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true) {
      // TodoWrite 는 자기 항목('todo:' 접두사)만 통째로 교체: TaskCreate/TaskUpdate 항목은 유지
      const todos: Record<string, TaskStatus> = {}
      e.todos.forEach((todo, i) => (todos[`todo:${i}`] = todo.status))
      await update($, tasks, map => ({
        ...Object.fromEntries(Object.entries(map).filter(([k]) => !k.startsWith('todo:'))),
        ...todos,
      }))
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

    if (rows.length === 0) {
      return next(e)
    }

    const table = $.ui.resolve(e)

    // 터미널은 위에서 걸렀다: 데스크톱·VS Code·모바일 표에는 모두 Svg 가 있다
    if (!('Svg' in table)) {
      return next(e)
    }

    const { Box, Button, Svg, Text } = table
    const bar = (row: Row) => <Svg source={barSvg(row.pct, row.grad, row.ticks)} width={BAR_W} height={BAR_H} alt={`${row.label} ${row.value}`} />

    // 단계·모드·Model 줄·게이지 막대와 오른쪽 옆 칸은 usage-band 가 그림. 여기는 Tasks 줄만
    const below = await next(e)

    // 열 폭은 모든 줄 공통: 라벨+막대(고정, 붙여 둠) | 퍼센트(오른쪽 정렬) | 메모(가변) | 닫기
    return (
      // 왼쪽 여백 없음: 위 usage-band 의 여백 안에서 그려져 ● 들이 Ponytail ● 과 같은 선에 섬
      <Box flexDirection="column">
        {below}
        {/* 단계 줄과 ❎·▶️ 버튼은 usage-band 가 모드 줄 위에 그림 */}
        <Box flexDirection="row" gap={2}>
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {rows.map(row => (
          <Box key={row.key} flexDirection="row" alignItems="center" gap={1}>
            <Box flexDirection="row" alignItems="center" gap={1} flexShrink={0}>
              {/* ● 은 색 글자, 라벨은 동작 없는 버튼: 위 usage-band 의 '● Ponytail' 버튼과 같은 여백이라 ● ·글자 시작점이 세로로 맞음 */}
              <Box width={12} flexShrink={0} flexDirection="row" alignItems="center">
                <Text color={row.grad[0]}>●</Text>
                <Button plain key={`label-${row.key}`} label={row.label} onPress={() => undefined} />
              </Box>
              {bar(row)}
            </Box>
            <Box width={5} flexShrink={0} justifyContent="flex-end">
              <Text bold>{row.value}</Text>
            </Box>
            <Box flexGrow={1} flexShrink={1} minWidth={0} overflow="hidden">
              <Text dimColor wrap="truncate">{row.note}</Text>
            </Box>
            <Box width={3} flexShrink={0} justifyContent="flex-end">
              {row.key === 'tasks' ? <Button key="hide" label="✕" onPress={() => update($, isHidden, () => true)} /> : <Text> </Text>}
            </Box>
          </Box>
        ))}
        </Box>
        </Box>
      </Box>
    )
  })
}

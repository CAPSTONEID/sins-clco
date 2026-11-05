import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'progress-pane',
  component: 'Pane',
  requestId: 'progress',
  props: {
    title: '진행 상황',
    isFocused: false,
    bodyColumns: 52,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 60 },
    view: {},
  },
} as const

const NOW = 1_700_000_000_000
// 작업 중 + 서브에이전트 3개(실행 중 2, 완료 1) + 로그 + advisor 기록
const SEED: Record<string, unknown> = {
  run: { id: 't1', rid: 'abcde', prompt: '흐름도 만들어줘', startedAt: NOW - 65_000, now: NOW, tools: 12, lastTool: 'Edit', tasks: [], subs: ['a1', 'a2', 'a3'] },
  agents: [
    { id: 'a1', type: 'Explore', description: 'maps the repo', status: 'running' },
    { id: 'a2', type: 'Explore', description: 'finds call sites', status: 'completed' },
    { id: 'a3', type: 'general-purpose', description: 'runs in a worktree', status: 'running' },
  ],
  subMeta: { a1: { model: 'claude-haiku-5-5' }, a2: { model: 'claude-haiku-5-5' }, a3: { model: 'claude-haiku-5-5' } },
  subStats: { a1: { startedAt: NOW - 20_000, tools: 4, lastTool: 'Grep' } },
  log: [
    { t: NOW - 3000, model: 'claude-opus-5-5', sub: false, tool: 'Edit', arg: 'register.tsx' },
    { t: NOW - 1000, model: 'claude-haiku-5-5', sub: true, tool: 'Grep', arg: 'subRows' },
  ],
  lead: { model: 'claude-opus-5-5', effort: 'high', ctx: 412_000, advisor: 2, advisorAt: NOW - 5000 },
  jev: {
    kind: 'route', t: NOW - 2000, count: 3, pick: 'SMALL', conf: 0.55,
    rows: [{ label: 'SMALL · Haiku 5.5', p: 0.55 }, { label: 'MEDIUM · Sonnet 5.5', p: 0.3 }],
  },
}

test('진행 탭 흐름도: 메인 상자·카드·리드 복귀·세션 로그를 모든 화면에 그림', async ($, on) => {
  on('clock.now', () => ({ value: NOW }))
  on('state.get', (_, e) => {
    const key = (e as { key?: string }).key ?? ''
    return key in SEED ? { value: { value: SEED[key], version: 1 } } : { value: { value: undefined, version: 0 } }
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /OPUS 5\.5 · MAIN SESSION/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /effort ▮▮▮▯▯ high · ctx 412k/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /maps the rep/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /✓ done/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /BACK TO OPUS 5\.5 · LEAD/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Grep subRows/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /ADVISOR · ON CALL/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\[2\/3\]/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /JEV · ROUTE/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /calls 3/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /split → 메인 판단/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ 0\.55$/ })).toBeDefined()
    await ui.unmount()
  }
})

test('빈 상태: 대기 중·위임 없음·기록 없음', async ($, on) => {
  on('clock.now', () => ({ value: NOW }))
  on('state.get', () => ({ value: { value: undefined, version: 0 } }))
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /^대기 중$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /위임 없음/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /기록 없음/ })).toBeDefined()
  await ui.unmount()
})

test('Bash 로 jev.py route 를 돌리면 결과가 Jev 상자에 뜸', async ($, on) => {
  on('clock.now', () => ({ value: NOW }))
  on('tool.call', () => ({
    result: {},
    text: JSON.stringify({ recommended: 'SMALL', confidence: 0.83, options: [{ lane: 'SMALL', model: 'Haiku 5.5', suitability: 81 }] }),
  }))
  await $.tool.call({ tool: 'Bash', command: 'python3 ~/.claude/skills/_shared/jev.py route "변환"' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /calls 1/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /sharp → 위임/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^ 0\.81$/ })).toBeDefined()
  await ui.unmount()
})

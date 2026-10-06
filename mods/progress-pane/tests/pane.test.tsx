import { expect, mock, test } from 'claude-code/testing'

// 턴 시작 → 할 일 2개 중 1개 완료 → 1/2 · 50% 표시
test('할 일 목록 기준 진행률', async ($, on) => {
  mock.clock(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }) as never)
  on('tool.call', () => ({ result: {} }) as never)
  await $.turn.start({ text: '작업', turnId: 't1' })
  await $.tool.call({
    tool: 'TodoWrite',
    todos: [
      { content: '리서치', status: 'completed', activeForm: '리서치 중' },
      { content: '기획', status: 'in_progress', activeForm: '기획 중' },
    ],
  } as never)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'progress-pane', surface, component: 'Pane', requestId: 'progress', props: {} as never })
    expect(await ui.find({ type: 'Text', text: /1\/2 · 50%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /▶ 기획 중/ })).toBeDefined()
    await ui.unmount()
  }
})

import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

const mountPane = ($: Engine, surface: 'terminal' | 'desktop') =>
  $.ui.mount({ plugin: 'progress-pane', surface, component: 'Pane', requestId: 'progress', props: {} as never })

// 진행 중: 할 일 2개 중 1개 완료 → 1/2 · 50%, 현재 단계 표시
test('할 일 목록 기준 진행률', async ($, on) => {
  mock.clock(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }) as never)
  on('tool.call', () => ({ result: {} }) as never)
  await $.turn.start({ text: '카드뉴스 만들어줘', turnId: 't1' })
  await $.tool.call({
    tool: 'TodoWrite',
    todos: [
      { content: '리서치', status: 'completed', activeForm: '리서치 중' },
      { content: '기획', status: 'in_progress', activeForm: '기획 중' },
    ],
  } as never)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountPane($, surface)
    expect(await ui.find({ type: 'Text', text: /1\/2 · 50%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /└ 기획 중/ })).toBeDefined()
    await ui.unmount()
  }
})

// 완료된 작업은 사라지지 않고 요약 설명과 함께 누적
test('완료 기록 누적 + 짧은 설명', async ($, on) => {
  mock.clock(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }) as never)
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: {} }) as never)
  let n = 0
  on('model.complete', () => ({ value: { isAnswered: true, text: ['카드뉴스 기획', '썸네일 문구 작성'][n++], usage: {} } }) as never)

  for (const [id, text] of [['t1', '카드뉴스 만들어줘'], ['t2', '썸네일 문구 뽑아줘']] as const) {
    await $.turn.start({ text, turnId: id })
    await $.tool.call({ tool: 'Bash', command: 'ls', description: 'ls' } as never)
    await $.turn.complete({ turnId: id, answer: '', durationMs: 1, isAborted: false, reason: 'answer' })
  }
  // 도구 안 쓴 대화 턴은 기록 안 됨
  await $.turn.start({ text: '고마워', turnId: 't3' })
  await $.turn.complete({ turnId: 't3', answer: '', durationMs: 1, isAborted: false, reason: 'answer' })

  const ui = await mountPane($, 'terminal')
  expect(await ui.find({ type: 'Text', text: /완료 기록 2건/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '카드뉴스 기획' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '썸네일 문구 작성' })).toBeDefined()
  await ui.unmount()
})

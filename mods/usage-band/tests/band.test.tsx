import { expect, mock, test } from 'claude-code/testing'

// 스냅샷을 넣으면 세 줄 게이지가 퍼센트·상세와 함께 그려지는지
test('세 게이지가 터미널에 그려진다', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  mock.clock(on)
  // 엔진이 턴 끝에 밀어주는 측정값을 그대로 흉내
  await $.session.measure({
    context: { tokens: 349_000, window: 1_000_000, percent: 35 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 2 },
      { kind: 'seven_day', percentUsed: 42 },
    ],
    changed: ['context', 'rateLimits'],
  })
  const ui = await $.ui.mount({
    plugin: 'usage-band',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 } as never,
  })
  expect(await ui.find({ type: 'Text', text: /35%/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /349K \/ 1\.0M 토큰/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /42%/ })).toBeDefined()
  await ui.unmount()
})

test('맨 위에 구분선이 있다', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  mock.clock(on)
  await $.session.measure({
    context: { tokens: 1000, window: 1_000_000, percent: 1 },
    rateLimits: [],
    changed: ['context'],
  })
  const ui = await $.ui.mount({
    plugin: 'usage-band',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 40 } as never,
  })
  expect(await ui.find({ type: 'Text', text: /^─{38}$/ })).toBeDefined()
  await ui.unmount()
})

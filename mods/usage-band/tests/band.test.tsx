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

test('맨 위에 구분선이 있다 (왼쪽 여백 1칸 + 왼쪽 [×] [‣] 버튼 자리 8칸 제외)', async ($, on) => {
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
  expect(await ui.find({ type: 'Text', text: /^─{31}$/ })).toBeDefined()
  await ui.unmount()
})

test('모드 줄: 단계 없어도 Ponytail । Caveman 한 줄로 그린다', async ($, on) => {
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
  expect(await ui.find({ type: 'Text', text: ' FULL' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'ON ' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: ' । ' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: ' (2/3)' })).toBeDefined()
  // Caveman 이름 클릭: FULL → ULTRA → OFF
  await ui.press({ key: 'mode-caveman' })
  expect(await ui.find({ type: 'Text', text: ' ULTRA' })).toBeDefined()
  await ui.press({ key: 'mode-caveman' })
  expect(await ui.find({ type: 'Text', text: 'OFF ' })).toBeDefined()
  // Humanize 이름 클릭: 기본 → 적극 → OFF
  expect(await ui.find({ type: 'Text', text: ' 기본' })).toBeDefined()
  await ui.press({ key: 'mode-humanize' })
  expect(await ui.find({ type: 'Text', text: ' 적극' })).toBeDefined()
  await ui.press({ key: 'mode-humanize' })
  expect(await ui.find({ type: 'Text', text: ' 적극' })).toBeUndefined()
  await ui.unmount()
})

test('Model 이름 클릭 → 선택 줄 → 고르면 /model 실행·표시 갱신·줄 닫힘', async ($, on) => {
  const ran: string[] = []
  on('command.run', (_, e) => {
    ran.push(`${e.command} ${e.args}`)
    return { text: '' }
  })
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
    props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 120 } as never,
  })
  await ui.press({ key: 'pick-model' })
  expect(await ui.find({ type: 'Text', text: '[Opus 5.5]' })).toBeDefined()
  await ui.press({ key: 'p-opus' })
  expect(ran).toContain('model opus')
  expect(await ui.find({ type: 'Text', text: '[Opus 5.5]' })).toBeUndefined()
  // Effort 도 같은 방식
  await ui.press({ key: 'pick-effort' })
  await ui.press({ key: 'p-high' })
  expect(ran).toContain('effort high')
  expect(await ui.find({ type: 'Text', text: ' HIGH' })).toBeDefined()
  // 옆 칸 4줄: 서브에이전트 없으면 is resting, Render 는 없으면 none, Advisor 클릭 → 선택 줄 → OFF 는 /advisor off
  expect(await ui.find({ type: 'Text', text: 'Subagents' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'is resting' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Render bar' })).toBeDefined()
  await ui.press({ key: 'pick-advisor' })
  expect(await ui.find({ type: 'Text', text: '[Fable 5.1]' })).toBeDefined()
  await ui.press({ key: 'p-off' })
  expect(ran).toContain('advisor off')
  expect(await ui.find({ type: 'Text', text: 'off' })).toBeDefined()
  await ui.unmount()
})

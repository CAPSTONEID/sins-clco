import { expect, mock, test } from 'claude-code/testing'

const PROPS = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100 } as never
const HOUR = 3_600_000

for (const surface of ['desktop', 'vscode'] as const) {
  test(`tasks row counts and turns Done at 100% (${surface})`, async ($, on) => {
    let n = 0
    on('tool.call', { tool: 'TaskCreate' }, () => ({ result: { task: { id: String(++n), subject: 's' } } }) as never)
    on('tool.call', { tool: 'TaskUpdate' }, () => ({ result: { success: true, taskId: '1', updatedFields: ['status'] } }) as never)

    const drawn = async () => JSON.stringify(
      await (await $.ui.mount({ plugin: 'task-progress-band', surface, component: 'AbovePrompt', props: PROPS })).drawn(),
    )

    await $.tool.call({ tool: 'TaskCreate', subject: 'a', description: 'a' })
    await $.tool.call({ tool: 'TaskCreate', subject: 'b', description: 'b' })
    expect(await drawn()).toContain('0/2 완료')

    await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'completed' })
    expect(await drawn()).toContain('1/2 완료')

    await $.tool.call({ tool: 'TaskUpdate', taskId: '2', status: 'completed' })
    const done = await drawn()
    expect(done).toContain('2/2 완료')
    expect(done).toContain('Done')
  })

  test(`usage rows show 5h and 7d percent with time to reset (${surface})`, async ($, on) => {
    const t = Date.UTC(2026, 9, 6, 12)
    mock.clock(on, { now: t })
    on('session.measure', (_$, e) => ({ changed: e.changed }))
    await $.session.measure({
      context: { tokens: 84_000, window: 200_000, percent: 42 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 23.5, resetsAt: new Date(t + 2 * HOUR + 13 * 60_000 + 5_000).toISOString() },
        { kind: 'seven_day', percentUsed: 91, resetsAt: new Date(t + 3 * 24 * HOUR + 4 * HOUR + 5_000).toISOString() },
      ],
      changed: ['rateLimits'],
    })

    const drawn = JSON.stringify(
      await (await $.ui.mount({ plugin: 'task-progress-band', surface, component: 'AbovePrompt', props: PROPS })).drawn(),
    )
    expect(drawn).toContain('5시간 한도')
    expect(drawn).toContain('24%')
    expect(drawn).toContain('2시간 13분 후 초기화')
    expect(drawn).toContain('7일 한도')
    expect(drawn).toContain('3일 4시간 후 초기화')
    expect(drawn).toContain('컨텍스트')
    expect(drawn).toContain('42%')
    expect(drawn).toContain('84K / 200K 토큰')
    // 그라디언트: 컨텍스트 줄 시작색, 91%인 7일 줄은 빨강 쪽 그라디언트
    expect(drawn).toContain('#06b6d4')
    expect(drawn).toContain('#ef4444')
    if (surface === 'desktop') expect(drawn).toContain('linearGradient')
    expect(drawn).not.toContain('Tasks')
  })

  test(`rows show right at session start from last session's values (${surface})`, async ($, on) => {
    const t = Date.UTC(2026, 9, 6, 12)
    mock.clock(on, { now: t })
    // 지난 세션이 저장한 값: 5시간 창은 아직 진행 중, 7일 창은 이미 초기화 시각이 지남
    mock.store(on, {
      limits: [
        { kind: 'five_hour', percentUsed: 40, resetsAt: new Date(t + HOUR + 5_000).toISOString() },
        { kind: 'seven_day', percentUsed: 55, resetsAt: new Date(t - HOUR).toISOString() },
      ],
    })
    // 첫 응답 전: 엔진은 창 크기만 알고 사용량은 비어 있다
    on('session.usage', () => ({ value: { startedAt: t, context: { window: 200_000 }, rateLimits: [] } }) as never)
    on('session.start', (_$, e) => ({ cwd: e.cwd }))

    await $.session.start({ cwd: '/tmp', surface, isInteractive: true } as never)

    const drawn = JSON.stringify(
      await (await $.ui.mount({ plugin: 'task-progress-band', surface, component: 'AbovePrompt', props: PROPS })).drawn(),
    )
    expect(drawn).toContain('컨텍스트')
    expect(drawn).toContain('— / 200K 토큰')
    expect(drawn).toContain('40%')
    expect(drawn).toContain('1시간 0분 후 초기화 · 이전 값')
    expect(drawn).toContain('초기화됨 · 이전 값')
    expect(drawn).not.toContain('55%')
  })
}

// CLI(터미널)는 usage-band 몫: 이 모드는 그리지 않고 아래(엔진)로 넘긴다
test('terminal: passes the band through', async ($, on) => {
  let isPassed = false
  mock.clock(on, { now: Date.UTC(2026, 9, 6, 12) })
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('ui.render', { component: 'AbovePrompt' }, () => ((isPassed = true), { type: 'Text', children: ['engine'] }) as never)
  await $.session.measure({
    context: { tokens: 84_000, window: 200_000, percent: 42 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 10 }],
    changed: ['context', 'rateLimits'],
  })

  const drawn = JSON.stringify(
    await (await $.ui.mount({ plugin: 'task-progress-band', surface: 'terminal', component: 'AbovePrompt', props: PROPS })).drawn(),
  )
  expect(isPassed).toBe(true)
  expect(drawn).toContain('engine')
  expect(drawn).not.toContain('컨텍스트')
})

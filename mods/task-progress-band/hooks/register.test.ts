import { expect, mock, test } from 'claude-code/testing'

const PROPS = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100 } as never

for (const surface of ['desktop', 'vscode'] as const) {
  test(`tasks row counts and turns Done at 100% (${surface})`, async ($, on) => {
    // 엔진 몫(아래 밴드) 대역
    on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', children: [] }) as never)
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

  test(`TodoWrite keeps TaskCreate tasks instead of replacing them (${surface})`, async ($, on) => {
    // 엔진 몫(아래 밴드) 대역
    on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', children: [] }) as never)
    let n = 0
    on('tool.call', { tool: 'TaskCreate' }, () => ({ result: { task: { id: String(++n), subject: 's' } } }) as never)
    on('tool.call', { tool: 'TodoWrite' }, () => ({ result: {} }) as never)

    const drawn = async () => JSON.stringify(
      await (await $.ui.mount({ plugin: 'task-progress-band', surface, component: 'AbovePrompt', props: PROPS })).drawn(),
    )
    const todo = (status: 'pending' | 'completed') => ({ content: 'x', activeForm: 'x', status })

    await $.tool.call({ tool: 'TaskCreate', subject: 'a', description: 'a' })
    await $.tool.call({ tool: 'TaskCreate', subject: 'b', description: 'b' })
    await $.tool.call({ tool: 'TodoWrite', todos: [todo('completed'), todo('completed')] })
    // TaskCreate 2건(pending) + todo 2건(completed) = 2/4. 예전엔 todo 만 남아 Done 으로 보였다
    const mixed = await drawn()
    expect(mixed).toContain('2/4 완료')
    expect(mixed).not.toContain('Done')

    // TodoWrite 를 다시 쓰면 todo 항목만 교체되고 TaskCreate 항목은 그대로
    await $.tool.call({ tool: 'TodoWrite', todos: [todo('pending')] })
    expect(await drawn()).toContain('0/3 완료')
  })

  test(`TaskUpdate on an unknown id is ignored (${surface})`, async ($, on) => {
    // 엔진 몫(아래 밴드) 대역
    on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', children: [] }) as never)
    on('tool.call', { tool: 'TaskCreate' }, () => ({ result: { task: { id: '1', subject: 's' } } }) as never)
    on('tool.call', { tool: 'TaskUpdate' }, () => ({ result: { success: true, taskId: '9', updatedFields: ['status'] } }) as never)

    const drawn = async () => JSON.stringify(
      await (await $.ui.mount({ plugin: 'task-progress-band', surface, component: 'AbovePrompt', props: PROPS })).drawn(),
    )

    await $.tool.call({ tool: 'TaskCreate', subject: 'a', description: 'a' })
    await $.tool.call({ tool: 'TaskUpdate', taskId: '9', status: 'completed' })
    // 없는 id 9 는 유령 항목이 되지 않는다: 여전히 0/1
    expect(await drawn()).toContain('0/1 완료')
  })

  test(`gauges and model row are left to usage-band and the band beneath is kept (${surface})`, async ($, on) => {
    on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Text', children: ['beneath'] }) as never)
    on('tool.call', { tool: 'TaskCreate' }, () => ({ result: { task: { id: '1', subject: 's' } } }) as never)
    on('session.measure', (_$, e) => ({ changed: e.changed }))
    await $.session.measure({ context: { tokens: 84_000, window: 200_000, percent: 42 }, rateLimits: [{ kind: 'five_hour', percentUsed: 10 }], changed: ['context', 'rateLimits'] })
    const drawn = async () => JSON.stringify(
      await (await $.ui.mount({ plugin: 'task-progress-band', surface, component: 'AbovePrompt', props: PROPS })).drawn(),
    )
    // 작업이 없으면 그리지 않고 넘김
    expect(await drawn()).not.toContain('컨텍스트')
    await $.tool.call({ tool: 'TaskCreate', subject: 'a', description: 'a' })
    const d = await drawn()
    expect(d).toContain('beneath')
    expect(d).toContain('0/1 완료')
    expect(d).not.toContain('컨텍스트')
    expect(d).not.toContain('5시간 한도')
    // 아래 밴드 자리(engine ref)가 Tasks 줄보다 위
    expect(d.indexOf('"type":"engine"')).toBeLessThan(d.indexOf('0/1 완료'))
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

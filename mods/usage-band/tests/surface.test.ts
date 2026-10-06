import { expect, mock, test } from 'claude-code/testing'

const PROPS = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100 } as never

// 터미널은 usage-band, 데스크톱·VS Code 는 task-progress-band 가 입력창 위를 그린다
for (const surface of ['terminal', 'desktop', 'vscode'] as const) {
  test(`${surface}: ${surface === 'terminal' ? '게이지를 그린다' : '그리지 않고 넘긴다'}`, async ($, on) => {
    const t = Date.UTC(2026, 9, 6, 12)
    mock.clock(on, { now: t })
    on('session.measure', (_$, e) => ({ changed: e.changed }))
    on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Text', children: ['engine'] }) as never)
    await $.session.measure({
      context: { tokens: 84_000, window: 200_000, percent: 42 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 10, resetsAt: new Date(t + 3_600_000).toISOString() }],
      changed: ['context', 'rateLimits'],
    })
    const drawn = JSON.stringify(
      await (await $.ui.mount({ plugin: 'usage-band', surface, component: 'AbovePrompt', props: PROPS })).drawn(),
    )
    if (surface === 'terminal') expect(drawn).not.toContain('engine')
    else expect(drawn).toContain('engine')
  })
}

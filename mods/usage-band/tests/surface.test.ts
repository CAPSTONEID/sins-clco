import { expect, mock, test } from 'claude-code/testing'

const PROPS = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100 } as never

// 터미널은 usage-band 전체, 데스크톱 앱은 조작 줄(모드·Model·Effort·Advisor) + 아래 task-progress-band, VS Code 는 넘김
for (const surface of ['terminal', 'desktop', 'vscode'] as const) {
  test(`${surface}: ${surface === 'terminal' ? '게이지를 그린다' : surface === 'desktop' ? '조작 줄 + 아래 밴드' : '그리지 않고 넘긴다'}`, async ($, on) => {
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
    if (surface === 'desktop') {
      for (const word of ['Ponytail', 'Caveman', 'Humanize', 'Model', 'Effort', 'Advisor']) expect(drawn).toContain(word)
      // 게이지 막대는 task-progress-band 몫: 데스크톱에선 안 그림
      expect(drawn).not.toContain('5시간 한도')
      expect(drawn.indexOf('Ponytail')).toBeLessThan(drawn.indexOf('engine'))
      // Render bar 는 게이지와 같은 Svg 막대 (터미널의 █░ 글자 막대 아님)
      expect(drawn).toContain('"alt":"Render bar -"')
      expect(drawn).not.toContain('░')
      // × · ➤ 글자 버튼은 Humanize 뒤 같은 줄에 (이모지 버튼 아님)
      expect(drawn).not.toContain('❎')
      expect(drawn.indexOf('Humanize')).toBeLessThan(drawn.indexOf('"label":"×"'))
      expect(drawn.indexOf('"label":"×"')).toBeLessThan(drawn.indexOf('"label":"➤"'))
    }
  })
}

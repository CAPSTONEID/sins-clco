import { expect, mock, test } from 'claude-code/testing'

const PROPS = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100 } as never

// 터미널은 usage-band 전체, 데스크톱 앱은 조작 줄(모드·Model·Effort·Advisor) + 게이지 + 아래 밴드, VS Code 는 넘김
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
      // 게이지 3줄도 usage-band 가 Model 아래에 그림 (플러그인 순서와 무관하게 옆 칸과 같은 행)
      for (const word of ['컨텍스트', '84K / 200K 토큰', '5시간 한도', '1시간 0분 후 초기화', '"alt":"5시간 한도 10%"', '7일 한도', '대기 중']) expect(drawn).toContain(word)
      expect(drawn.indexOf('Model')).toBeLessThan(drawn.indexOf('컨텍스트'))
      // 아래 밴드는 게이지·옆 칸 다음
      expect(drawn.indexOf('Render bar')).toBeLessThan(drawn.indexOf('engine'))
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

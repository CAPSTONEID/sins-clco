import { expect, test } from 'claude-code/testing'
import { argOf, arrowRows, arrows, cardBar, dots, effortBar, forkLine, kTok, layout, logText, shortTool } from '../hooks/flow'

test('카드 배치: 너비에 맞춰 한 줄 장수와 카드 너비', async () => {
  expect(layout(3, 50)).toEqual({ per: 3, cw: 16 })
  expect(layout(1, 50)).toEqual({ per: 1, cw: 50 })
  // 좁으면 한 줄 장수를 줄임
  expect(layout(3, 30)).toEqual({ per: 1, cw: 30 })
  expect(layout(0, 40).per).toBe(1)
})

test('갈래선: 위는 ╭┴╮, 아래는 ╰┬╯, 카드 가운데마다 ▼', async () => {
  // per 3, cw 5 → 길이 17, 가운데 2·8·14, 중앙 8 은 카드 가운데와 겹쳐 ┼
  expect(forkLine(3, 5, true)).toBe('  ╭─────┼─────╮  ')
  expect(forkLine(3, 5, false)).toBe('  ╰─────┼─────╯  ')
  expect(forkLine(2, 5, true)).toBe('  ╭──┴──╮  ')
  expect(forkLine(2, 5, false)).toBe('  ╰──┬──╯  ')
  expect(forkLine(1, 5, true)).toBe('  │  ')
  expect(arrows(2, 5)).toBe('  ▼     ▼  ')
})

test('달리는 점: 길이 유지, 가로선에만 점 두 개', async () => {
  const line = forkLine(2, 9, true)
  for (const p of [0, 1, 7]) {
    const parts = dots(line, p)
    expect(parts.map(x => x[0]).join('').length).toBe(line.length)
    expect(parts.filter(x => x[1]).length).toBe(2)
  }
  expect(dots('  │  ', 3)).toEqual([['  │  ', false]])
})

test('가로선 •: 퍼질 땐 가운데에서 바깥으로, 모일 땐 바깥에서 가운데로', async () => {
  // '  ╭──┴──╮  ' — 가운데 5, 가로선 3·4(왼쪽)와 6·7(오른쪽)
  const line = forkLine(2, 5, true)
  const at = (parts: [string, boolean][]) => {
    let i = 0
    const hot: number[] = []
    for (const [s, isDot] of parts) {
      if (isDot) hot.push(i)
      i += [...s].length
    }
    return hot
  }
  expect(dots(line, 0, true).filter(x => x[1]).every(x => x[0] === '•')).toBe(true)
  expect(at(dots(line, 0, true))).toEqual([4, 6])
  expect(at(dots(line, 1, true))).toEqual([3, 7])
  expect(at(dots(line, 0, false))).toEqual([3, 7])
  expect(at(dots(line, 1, false))).toEqual([4, 6])
})

test('카드 막대: 완료는 꽉 참, 실행 중은 3칸 블록이 흐름', async () => {
  expect(cardBar(5, 0, 'done').every(Boolean)).toBe(true)
  expect(cardBar(5, 0, 'idle').some(Boolean)).toBe(false)
  expect(cardBar(5, 0, 'run')).toEqual([true, true, true, false, false])
  expect(cardBar(5, 4, 'run')).toEqual([true, true, false, false, true])
})

test('표시 문구: effort 막대, 토큰, 도구 이름, 입력 요약', async () => {
  expect(effortBar('high')).toBe('▮▮▮▯▯ high')
  expect(effortBar(undefined)).toBe('기본')
  expect(effortBar(2048)).toBe('2048')
  expect(kTok(412_300)).toBe('412k')
  expect(kTok(1_250_000)).toBe('1.3M')
  expect(shortTool('mcp__progress-pane__steps')).toBe('steps')
  expect(argOf({ file_path: '/a/b/register.tsx' })).toBe('register.tsx')
  expect(argOf({ command: 'ls -la\necho hi' })).toBe('ls -la')
  expect(argOf({ other: 1 })).toBe('')
})

test('세션 로그 내역: 폭에 맞춰 자르고 … 표시, 한글은 2칸', async () => {
  expect(logText('Read', 'register.tsx', 30)).toBe('Read register.tsx')
  expect(logText('Bash', 'cd ~/.claude/mods/progress-pane && python3 -', 20)).toBe('Bash cd ~/.claude/m…')
  expect(logText('Bash', 'cd ~/.claude/mods/progress-pane && python3 -', 99).length).toBe(28)
  expect(logText('Edit', '', 10)).toBe('Edit')
  expect(logText('steps', '흐름도 만들기', 12)).toBe('steps 흐름…')
})

test('카드 화살표: 3줄, 흐를 땐 ▼가 한 칸씩 내려가고 나머지는 선(│)', async () => {
  expect(arrowRows(2, 5, 0, true)).toEqual(['  ▼     ▼  ', '  │     │  ', '  │     │  '])
  expect(arrowRows(2, 5, 1, true)).toEqual(['  │     │  ', '  ▼     ▼  ', '  │     │  '])
  expect(arrowRows(2, 5, 2, true)).toEqual(['  │     │  ', '  │     │  ', '  ▼     ▼  '])
  expect(arrowRows(2, 5, 3, true)).toEqual(arrowRows(2, 5, 0, true))
  expect(arrowRows(2, 5, 0, false)).toEqual(['  ┊     ┊  ', '  ┊     ┊  ', '  ▼     ▼  '])
})

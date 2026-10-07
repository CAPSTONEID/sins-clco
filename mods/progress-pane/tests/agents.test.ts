import { expect, test } from 'claude-code/testing'
import { age, parseAgents } from '../hooks/agents'
import { clip, fallback, TITLE_MAX } from '../hooks/run'

test('claude agents --json 출력을 패널 행으로 변환', async () => {
  // 실제 출력 형태: 이 세션(working), 끝난 세션(done), 이름 없는 막힌 세션(blocked)
  const json = JSON.stringify([
    { pid: 15180, id: 'af16972a', cwd: '/Users/x/📦 My Contents', kind: 'background', startedAt: 1000, sessionId: 'af16972a-22e5', name: '관제 시스템', status: 'busy', state: 'working' },
    { id: '0c593a99', cwd: '/Users/x/9. Lorem ipsum', kind: 'background', startedAt: 500, sessionId: '0c593a99-4688', name: 'Jev 확인', state: 'done' },
    { pid: 15162, id: '7b0570a7', cwd: '/Users/x/a', kind: 'background', sessionId: '7b0570a7-1', name: '7b0570a7', status: 'idle', state: 'blocked' },
  ])
  const rows = parseAgents(json, 'af16972a-22e5')
  expect(rows.map(r => [r.id, r.isSelf, r.isEnded, r.dir])).toEqual([
    ['af16972a', true, false, '📦 My Contents'],
    ['0c593a99', false, true, '9. Lorem ipsum'],
    ['7b0570a7', false, false, 'a'],
  ])
  // 이름이 id 와 같으면 이름 없음 처리
  expect(rows[2]?.name).toBe('(이름 없음)')
  // 깨진 출력은 빈 목록
  expect(parseAgents('not json', '')).toEqual([])

  expect(age(30_000)).toBe('방금')
  expect(age(12 * 60_000)).toBe('12분')
  expect(age(125 * 60_000)).toBe('2시간 5분')
})

test('제목은 글자 수 기준으로 자르고 … 표시', async () => {
  expect(clip('파일 삭제')).toBe('파일 삭제')
  const long = clip('응 그렇게 바꾸어주고, 에이전트 아래에 서브에이전트 패널도')
  expect([...long].length).toBe(TITLE_MAX + 1)
  expect(long.endsWith('…')).toBe(true)
  expect(clip('📦 My Contents', 5)).toBe('📦 My …')
  expect(fallback('  \n')).toBe('작업')
})

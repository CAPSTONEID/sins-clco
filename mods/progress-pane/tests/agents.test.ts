import { expect, test } from 'claude-code/testing'
import { age, parseAgents, splitHidden, toggle } from '../hooks/agents'
import { clip, fallback, mix, shortModel, TITLE_MAX } from '../hooks/run'

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
  // 대화형 세션: id·state 없이 sessionId·status 만
  const live = parseAgents(JSON.stringify([{ pid: 1, cwd: '/x/회사소개영상', kind: 'interactive', sessionId: '4a3dbd57-a66e', name: 'claude-47', status: 'busy' }]), '')
  expect(live.map(r => [r.id, r.state, r.isEnded, r.dir, r.pid, r.kind])).toEqual([['4a3dbd57-a66e', 'busy', false, '회사소개영상', 1, 'interactive']])
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

test('숨긴 세션은 숨겨진 에이전트로 분리, 이 세션은 숨겨지지 않음', async () => {
  const rows = parseAgents(
    JSON.stringify([
      { id: 'me', sessionId: 'me', name: '이 세션', state: 'working' },
      { id: 'a', sessionId: 'a', name: 'A', state: 'idle' },
      { id: 'b', sessionId: 'b', name: 'B', state: 'idle' },
    ]),
    'me',
  )
  const [shown, stashed] = splitHidden(rows, ['a', 'me', 'gone'])
  expect(shown.map(x => x.id)).toEqual(['me', 'b'])
  expect(stashed.map(x => x.id)).toEqual(['a'])
  expect(toggle(['a'], 'b')).toEqual(['a', 'b'])
  expect(toggle(['a', 'b'], 'a')).toEqual(['b'])
})

test('점검 수정: 끝 슬래시·빈 이름·시각 없음·색 범위·CRLF·국기 이모지', async () => {
  const [row] = parseAgents(JSON.stringify([{ id: 'x', sessionId: 'x', cwd: '/Users/x/a/', name: '  ', state: 'idle' }]), '')
  expect(row?.dir).toBe('a')
  expect(row?.name).toBe('(이름 없음)')
  expect(age(NaN)).toBe('?')
  expect(mix(1.5)).toBe(mix(1))
  expect(mix(-0.5)).toBe(mix(0))
  expect(mix(1)).toMatch(/^#[0-9a-f]{6}$/)
  expect(fallback('foo\r\nbar')).toBe('foo')
  // 국기는 한 글자 — 반쪽으로 잘리지 않음
  expect(clip('🇰🇷🇺🇸', 1)).toBe('🇰🇷…')
})

test('모델 id 를 짧은 이름으로', async () => {
  expect(shortModel('claude-haiku-5-5')).toBe('haiku 5.5')
  expect(shortModel('claude-opus-5-5[1m]')).toBe('opus 5.5[1m]')
  expect(shortModel('sonnet')).toBe('sonnet')
})

test('자동 메시지로 시작한 턴은 태그 대신 정해 둔 제목', async () => {
  expect(fallback('<agent-message from="a1">\n[Subagent hand-back] ...')).toBe('서브에이전트 보고 처리')
  expect(fallback('  <task-notification>\n<task-id>x</task-id>')).toBe('백그라운드 작업 알림 처리')
  expect(fallback('그냥 요청')).toBe('그냥 요청')
})

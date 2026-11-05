import { expect, test } from 'claude-code/testing'
import { busyCount, cavemanFrom, taskSubs, humanizeOf, levelOf, modeNote, nextHumanize, nextMode, fitSteps, prettyModel, renderPct, until } from '../hooks/register'

test('모델 id → 표시 이름', async () => {
  expect(prettyModel('claude-opus-5-5')).toBe('Opus 5.5')
  expect(prettyModel('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
  expect(prettyModel('claude-sonnet-5-5[1m]')).toBe('Sonnet 5.5')
  expect(prettyModel('opus')).toBe('Opus')
})

test('모델 id 빈 세그먼트는 무시하고, 남는 게 없으면 원본 id', async () => {
  expect(prettyModel('claude--opus-5-5')).toBe('Opus 5.5')
  expect(prettyModel('claude-')).toBe('claude-')
  expect(prettyModel('-')).toBe('-')
})

test('초기화 시각 파싱 실패 시 NaN 대신 빈 문자열', async () => {
  const now = Date.parse('2026-10-16T00:00:00Z')
  expect(until('not-a-date', now)).toBe('')
  expect(until(undefined, now)).toBe('')
  expect(until('2026-10-16T04:46:00Z', now)).toBe('4시간 46분 후 초기화')
})

test('렌더 진행률: 과거 평균 대비 %, 기록 없으면 undefined, 최대 99', async () => {
  expect(renderPct(30, [60, 60])).toBe(50)
  expect(renderPct(539, [600])).toBe(89)
  expect(renderPct(900, [600])).toBe(99)
  expect(renderPct(30, undefined)).toBeUndefined()
  expect(renderPct(30, [])).toBeUndefined()
})

test('단계 줄(가로): 넓으면 전부, 좁으면 진행 중 주변만 남기고 앞뒤 생략', async () => {
  const t = (subject: string, status: string) => ({ subject, status })
  const tasks = [t('리서치', 'completed'), t('기획', 'completed'), t('디자인', 'in_progress'), t('렌더', 'pending'), t('업로드', 'pending')]
  const wide = fitSteps(tasks, 200)
  expect(wide.items.map(i => i.text)).toEqual(['리서치', '기획', '디자인', '렌더', '업로드'])
  expect(wide.before || wide.after).toBe(false)
  const narrow = fitSteps(tasks, 24)
  expect(narrow.items.some(i => i.status === 'in_progress')).toBe(true)
  expect(narrow.before && narrow.after).toBe(true)
  expect(fitSteps([t('아주아주아주긴단계이름입니다요', 'pending')], 200).items[0]!.text).toBe('아주아주아주긴단계…')
})

test('caveman·ponytail 모드 줄: 입력 해석과 강도 칸 수', async () => {
  expect(cavemanFrom('stop caveman')).toBeUndefined()
  expect(cavemanFrom(' Normal Mode ')).toBeUndefined()
  expect(cavemanFrom('/caveman', { name: 'caveman', args: '' })).toBe('full')
  expect(cavemanFrom('/caveman ultra', { name: 'caveman', args: 'ultra' })).toBe('ultra')
  expect(cavemanFrom('/caveman off', { name: 'caveman', args: 'off' })).toBeUndefined()
  expect(cavemanFrom('add a normal mode toggle')).toBeNull()
  expect(levelOf('lite')).toBe(0)
  expect(levelOf('full')).toBe(1)
  expect(levelOf('ultra')).toBe(2)
  expect(levelOf('wenyan-ultra')).toBe(2)
  expect(levelOf('wenyan')).toBe(1)
  expect(levelOf('xyz')).toBe(-1)
  // 이름 클릭 순환: OFF → LITE → FULL → ULTRA → OFF
  expect(nextMode(undefined)).toBe('lite')
  expect(nextMode('lite')).toBe('full')
  expect(nextMode('full')).toBe('ultra')
  expect(nextMode('ultra')).toBeUndefined()
  expect(nextMode('wenyan-ultra')).toBeUndefined()
  expect(modeNote('caveman', undefined)).toContain('OFF')
  expect(modeNote('ponytail', 'ultra')).toContain('level: ultra')
  // Humanize: 파일 값 해석과 클릭 순환 OFF → 보수 → 기본 → 적극 → OFF
  expect(humanizeOf(undefined)).toBe('기본')
  expect(humanizeOf('on')).toBe('기본')
  expect(humanizeOf('off\n')).toBeUndefined()
  expect(humanizeOf('적극')).toBe('적극')
  expect(nextHumanize(undefined)).toBe('보수')
  expect(nextHumanize('보수')).toBe('기본')
  expect(nextHumanize('기본')).toBe('적극')
  expect(nextHumanize('적극')).toBeUndefined()
  expect(modeNote('humanize', '적극')).toContain('ON — 강도: 적극')
})

test('Subagents 칸 개수: 실행 중 + 완료 전 hc', async () => {
  const a = (type: string, status: string) => ({ type, status })
  expect(busyCount([])).toBe(0)
  expect(busyCount([a('general-purpose', 'running'), a('general-purpose', 'completed'), a('hc', 'idle'), a('hc', 'running'), a('hc', 'completed')])).toBe(3)
})

test('단계 줄 서브에이전트: 지금 작업(없으면 마지막 완료 작업)이 띄운 것 중 살아 있는 것만', async () => {
  const alive = [{ id: 'hc:t1' }, { id: 'hc:t2' }, { id: 'x9' }]
  expect(taskSubs({ subs: ['hc:t1', 'hc:gone'] }, [{ subs: ['x9'] }], alive)).toEqual([{ id: 'hc:t1' }])
  expect(taskSubs(null, [{ subs: ['x9', 'hc:t2'] }, { subs: ['hc:t1'] }], alive)).toEqual([{ id: 'hc:t2' }, { id: 'x9' }])
  expect(taskSubs(null, [], alive)).toEqual([])
  expect(taskSubs({}, [{ subs: ['x9'] }], alive)).toEqual([])
  // 단계 목록이 여러 턴에 걸치면 그 시작 뒤로 끝난 작업 전부
  expect(taskSubs(null, [{ subs: [], endedAt: 300 }, { subs: ['hc:t1'], endedAt: 200 }, { subs: ['x9'], endedAt: 50 }], alive, 100)).toEqual([{ id: 'hc:t1' }])
})

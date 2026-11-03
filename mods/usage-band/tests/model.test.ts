import { expect, test } from 'claude-code/testing'
import { fitSteps, prettyModel, renderPct, until } from '../hooks/register'

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

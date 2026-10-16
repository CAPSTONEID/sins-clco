import { expect, test } from 'claude-code/testing'
import { prettyModel, until } from '../hooks/register'

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

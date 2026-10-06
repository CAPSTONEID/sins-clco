import { expect, test } from 'claude-code/testing'
import { prettyModel } from '../hooks/register'

test('모델 id → 표시 이름', async () => {
  expect(prettyModel('claude-opus-5-5')).toBe('Opus 5.5')
  expect(prettyModel('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
  expect(prettyModel('claude-sonnet-5-5[1m]')).toBe('Sonnet 5.5')
  expect(prettyModel('opus')).toBe('Opus')
})

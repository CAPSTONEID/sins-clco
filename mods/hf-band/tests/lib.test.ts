import { expect, test } from 'claude-code/testing'
import { finished, ids, isSubmit, parseBalance } from '../hooks/lib'

test('잔액 파싱과 작업 완료 판별', async () => {
  expect(parseBalance('{"credits":775.76,"subscription_plan_type":"ultimate"}')).toEqual({ credits: 775.76, plan: 'ultimate' })
  expect(isSubmit('mcp__claude_ai_My_Higgsfield__generate_video')).toBe(true)
  expect(isSubmit('mcp__claude_ai_My_Higgsfield__balance')).toBe(false)
  const id = '123e4567-e89b-12d3-a456-426614174000'
  expect(ids(`{"job_id":"${id}","status":"queued"}`)).toEqual([id])
  expect(finished(`{"id":"${id}","status":"completed"}`, [id])).toEqual([id])
  expect(finished(`{"id":"${id}","status":"in_progress"}`, [id])).toEqual([])
})

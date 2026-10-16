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

test('여러 작업이 섞여도 각자 자기 status 로 판별', async () => {
  const a = '123e4567-e89b-12d3-a456-426614174001'
  const b = '123e4567-e89b-12d3-a456-426614174002'
  // 다음 작업(B)의 completed 가 A 로 새면 안 됨
  expect(finished(`[{"id":"${a}","status":"in_progress"},{"id":"${b}","status":"completed"}]`, [a, b])).toEqual([b])
  // 단일 id 완료
  expect(finished(`[{"id":"${a}","status":"completed"}]`, [a])).toEqual([a])
  // JSON 이 아닌 텍스트: 다음 id 직전까지만 창으로 봄
  expect(finished(`job ${a} is in_progress, job ${b} is completed`, [a, b])).toEqual([b])
  expect(finished(`앞말 ${a} status: failed`, [a])).toEqual([a])
})

test('JSON 으로 파싱되면 자기 status 없는 id 는 끝난 게 아님', async () => {
  const a = '123e4567-e89b-12d3-a456-426614174001'
  // job_ids 배열 + 안내 문구의 "completed" 가 텍스트 창으로 새면 안 됨
  expect(finished(`{"job_ids":["${a}"],"message":"will be completed soon"}`, [a])).toEqual([])
})

test('status 값은 전체 일치로 판별(nsfw_check_pending 은 끝난 게 아님)', async () => {
  const a = '123e4567-e89b-12d3-a456-426614174001'
  expect(finished(`{"id":"${a}","status":"nsfw_check_pending"}`, [a])).toEqual([])
  expect(finished(`{"id":"${a}","status":"Completed"}`, [a])).toEqual([a])
  // 텍스트 폴백도 `_` 를 단어의 일부로 봄
  expect(finished(`job ${a} nsfw_check_pending`, [a])).toEqual([])
})

test('id 와 job_id 둘 다 등록, 바깥 객체가 안쪽 같은 id 보다 우선', async () => {
  const a = '123e4567-e89b-12d3-a456-426614174001'
  const b = '123e4567-e89b-12d3-a456-426614174002'
  expect(finished(`{"id":"${a}","job_id":"${b}","status":"completed"}`, [a, b])).toEqual([a, b])
  expect(finished(`{"id":"${a}","status":"in_progress","parent":{"id":"${a}","status":"completed"}}`, [a])).toEqual([])
})

test('JSON 이 아닌 텍스트에서 id 앞에 쓴 status 도 같은 항목이면 인식', async () => {
  const a = '123e4567-e89b-12d3-a456-426614174001'
  const b = '123e4567-e89b-12d3-a456-426614174002'
  expect(finished(`{"status":"completed","id":"${a}"`, [a])).toEqual([a])
  // 앞 항목의 status 는 침범하지 않음
  expect(finished(`{"id":"${a}","status":"completed"},{"id":"${b}","status":"in_progress"`, [a, b])).toEqual([a])
})

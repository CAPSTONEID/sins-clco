import { expect, test } from 'claude-code/testing'
import { timeSteps } from '../hooks/register'

const s = (subject: string, status: 'pending' | 'in_progress' | 'completed') => ({ id: subject, subject, status })

test('단계 소요시간: 시작·완료 시각을 이어 받고, 진행 중을 건너뛴 완료는 앞 단계 끝부터', async () => {
  const a = timeSteps([], [s('A', 'in_progress'), s('B', 'pending')], 1000)
  expect(a[0]!.startedAt).toBe(1000)
  expect(a[1]!.startedAt).toBeUndefined()
  // A 완료 + B 진행 중
  const b = timeSteps(a, [s('A', 'completed'), s('B', 'in_progress'), s('C', 'pending')], 5000)
  expect(b[0]).toMatchObject({ startedAt: 1000, endedAt: 5000 })
  expect(b[1]!.startedAt).toBe(5000)
  // B·C 가 한 번에 완료: C 는 진행 중을 건너뜀 → B 끝(9000)부터
  const c = timeSteps(b, [s('A', 'completed'), s('B', 'completed'), s('C', 'completed')], 9000)
  expect(c[0]).toMatchObject({ startedAt: 1000, endedAt: 5000 })
  expect(c[1]).toMatchObject({ startedAt: 5000, endedAt: 9000 })
  expect(c[2]).toMatchObject({ startedAt: 9000, endedAt: 9000 })
})

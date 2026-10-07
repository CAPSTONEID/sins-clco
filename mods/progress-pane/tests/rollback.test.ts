import { expect, test } from 'claude-code/testing'
import type { Run } from '../types'
import { planRollback, shortId } from '../hooks/rollback'

const run = (id: string, files: Run['files'], extra: Partial<Run> = {}): Run => ({
  id, rid: shortId(id), files, prompt: id, startedAt: 0, now: 0, tools: 1, lastTool: 'Edit', tasks: [], ...extra,
})

test('5글자 작업 ID는 같은 입력이면 같고 0-9a-z 5자', async () => {
  expect(shortId('turn-1')).toBe(shortId('turn-1'))
  expect(shortId('turn-1')).not.toBe(shortId('turn-2'))
  expect(shortId('x')).toMatch(/^[0-9a-z]{5}$/)
})

test('대상 작업 전 상태로: 그 뒤 작업 포함, 경로마다 가장 오래된 원본', async () => {
  // hist 는 최신이 앞: C(가장 최근) → B → A
  const hist = [
    run('C', [{ path: '/p/a.md', snap: '/s/C-a' }, { path: '/p/new.md', snap: '/s/C-new' }]),
    run('B', [{ path: '/p/a.md', snap: '/s/B-a' }, { path: '/p/new.md', snap: null }]),
    run('A', [{ path: '/p/a.md', snap: '/s/A-a' }]),
  ]
  // B 전으로: B·C 를 되돌림. a.md 는 B 직전 원본, new.md 는 B 가 만든 파일이라 삭제(null)
  const plan = planRollback(hist, 'B')
  expect(plan?.ids).toEqual(['C', 'B'])
  expect([...(plan?.restore ?? [])]).toEqual([
    ['/p/a.md', '/s/B-a'],
    ['/p/new.md', null],
  ])
  // 이미 롤백된 작업은 다시 되돌리지 않음
  const again = planRollback([{ ...hist[0]!, rolledBack: true }, hist[1]!, hist[2]!], 'A')
  expect(again?.ids).toEqual(['B', 'A'])
  expect(planRollback(hist, 'zzz')).toBeUndefined()
})

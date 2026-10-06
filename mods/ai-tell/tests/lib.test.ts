import { expect, test } from 'claude-code/testing'
import { score } from '../hooks/lib'

test('AI 티 패턴이 몰린 글은 높음, 담백한 글은 낮음', async () => {
  const ai = '결론적으로 이 기술은 매우 중요하다. 따라서 우리는 변화에 대해 고민해야 한다. 이를 통해 시장에 대해 이해하고, 고객에 대해 배운다. 그러므로 지금이 행동할 때입니다. '.repeat(3)
  const human = '어제 촬영장에서 조명이 두 번 나갔다. 감독은 웃으면서 커피를 돌렸고 우리는 삼십 분 쉬었다. 다시 켜니 색이 더 좋았다. '.repeat(3)
  const bad = score('a.md', ai)
  expect(bad.grade).toBe('높음')
  expect(bad.hits.some(h => h.id === 'D-1')).toBe(true)
  expect(score('b.md', human).grade).toBe('낮음')
})

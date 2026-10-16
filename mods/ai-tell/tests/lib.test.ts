import { expect, test } from 'claude-code/testing'
import { clean, hangul, score } from '../hooks/lib'

test('AI 티 패턴이 몰린 글은 높음, 담백한 글은 낮음', async () => {
  const ai = '결론적으로 이 기술은 매우 중요하다. 따라서 우리는 변화에 대해 고민해야 한다. 이를 통해 시장에 대해 이해하고, 고객에 대해 배운다. 그러므로 지금이 행동할 때입니다. '.repeat(3)
  const human = '어제 촬영장에서 조명이 두 번 나갔다. 감독은 웃으면서 커피를 돌렸고 우리는 삼십 분 쉬었다. 다시 켜니 색이 더 좋았다. '.repeat(3)
  const bad = score('a.md', ai)
  expect(bad.grade).toBe('높음')
  expect(bad.hits.some(h => h.id === 'D-1')).toBe(true)
  expect(score('b.md', human).grade).toBe('낮음')
})

test('코드 블록 안 한글은 게이트와 점수 모두에서 제외', async () => {
  const code = '```\n' + '가나다라마바사아자차'.repeat(30) + '\n```\n'
  const prose = '결론적으로 이 기술은 매우 중요하다. 따라서 변화에 대해 고민해야 한다.'
  // 원문 한글은 300자 이상이지만 본문은 미만 → register 게이트에서 걸러짐
  expect(hangul(code + prose)).toBeGreaterThanOrEqual(300)
  expect(hangul(clean(code + prose))).toBeLessThan(300)
  // 점수 분모도 본문만 센다 (코드 블록 유무와 무관)
  expect(score('c.md', code + prose)).toEqual(score('c.md', prose))
})

test('낱개 < 는 줄바꿈을 넘어 본문을 지우지 않음', async () => {
  const raw = 'x<y 라고 쓴다\n중간 문단은 남아야 한다 따라서 결론이다\n그리고 a>b 도 쓴다'
  expect(clean(raw)).toContain('중간 문단은 남아야 한다')
  expect(clean('앞 <b>굵게</b> 뒤')).not.toContain('<b>')
})

test('URL 은 한글·마크다운 괄호 앞에서 멈춤', async () => {
  const out = clean('[원문](https://example.com/report)에 대해 쓴다 https://a.com/x 끝')
  expect(out).toContain('에 대해 쓴다')
  expect(out).not.toContain('example.com')
  expect(out).not.toContain('a.com')
  expect(clean('https://a.com/path에서 본다')).toContain('에서 본다')
})

test('태그 모양이 아닌 < > 는 지우지 않음', async () => {
  expect(clean('점수가 3<5이고 7>2인 경우')).toContain('3<5이고 7>2인')
  expect(clean('앞 <br/> 뒤 <a href="x">링크</a>')).not.toMatch(/<\/?(br|a)/)
})

test('C-5 는 이모지 표시형만 셈(©™®✔ 제외, 조합 시퀀스는 1개)', async () => {
  const emoji = (s: string) => score('e.md', s).hits.find(h => h.id === 'C-5')?.count ?? 0
  expect(emoji('© ™ ® ✔ © ™ ® ✔')).toBe(0)
  expect(emoji('😀 ✅ 🚀')).toBe(3)
  // 국기·ZWJ 가족·피부톤은 각각 1개
  expect(emoji('🇰🇷 👨‍👩‍👧 👍🏽')).toBe(3)
})

test('~~~ 펜스도 제거, 들여쓰기 블록은 그대로 셈', async () => {
  const code = '~~~\n' + '가나다라마바사아자차'.repeat(30) + '\n~~~\n'
  expect(hangul(clean(code + '본문'))).toBe(2)
  // ponytail 주석대로 들여쓰기 코드는 남음
  expect(hangul(clean('    가나다라'))).toBe(4)
})

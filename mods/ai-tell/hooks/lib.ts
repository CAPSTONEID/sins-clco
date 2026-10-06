import type { Hit, Report } from '../types'

// humanize-korean quick-rules.md 에서 정규식으로 셀 수 있는 패턴만 추림
// [id, 이름, 가중치(S1=2, S2=1), 정규식, 이 횟수부터 신호로 셈]
// ponytail: 형태소 분석 없는 근사치, 정밀 판정은 /humanize-korean
const RULES: [string, string, number, RegExp, number][] = [
  ['A-1', '~에 대해', 2, /에 대해/g, 3],
  ['A-3', '~에 있어', 2, /에 있어/g, 1],
  ['A-5', '~와 관련하여', 1, /[와과] 관련(하여|된|해)/g, 2],
  ['A-6', '~에 기반/바탕으로', 1, /에 기반(하여|한|해)|[을를] 바탕으로/g, 2],
  ['A-7', '가지고 있다', 2, /[을를] 가지고 있/g, 1],
  ['A-8', '이중 피동', 2, /되어지|되어진|지게 된/g, 1],
  ['A-9', '~에 의해', 1, /에 의해/g, 2],
  ['A-11', '~을 위해', 1, /[을를] 위해/g, 3],
  ['A-19', '이중 조사(에서의 등)', 1, /에서의|에로의|으로의|으로부터의/g, 1],
  ['A-20', '~되고/지고 있다', 1, /[되지]고 있[다습]/g, 3],
  ['A-21', '단순한 X를 넘어', 1, /단순[한히] [^.\n]{1,25}넘어/g, 1],
  ['A-24', '더 이상 ~않다', 1, /더 이상 [^.\n]{0,20}(않|아니|없)/g, 2],
  ['C-5', '이모지', 2, /\p{Extended_Pictographic}/gu, 3],
  ['C-8', '~가 아니라 대구', 2, /(것이|[가이]) 아니라/g, 2],
  ['C-11', '연결어미 뒤 쉼표', 2, /(고|며|지만|면서|아서|어서)\s*,/g, 3],
  ['D-1', '결산 표현(따라서·결론적으로)', 2, /결론적으로|따라서|이를 통해|그러므로|요약하면|정리하자면/g, 4],
  ['D-2', '의의 과장', 2, /시사하는 바가 크|주목할 만하|매우 중요하/g, 1],
  ['D-3', '열거 도입구', 2, /다음과 같[은이]|[두세네] 가지로 나눌/g, 1],
  ['D-6', '~할 때입니다', 1, /[할될] 때[입이]|시점입니다|시점이다|순간입니다/g, 1],
  ['D-8', '~한 것은/핵심은', 1, /(필요한|중요한) 것은|핵심은|관건은/g, 2],
  ['D-10', '~하는 이유다', 1, /이유[다입]/g, 2],
  ['G-1', '~로 보인다 반복', 1, /로 보인다|로 판단된다|로 여겨진다|것으로 보입니다/g, 3],
  ['H-4', '"즉" 남발', 1, /(^|\s)즉[,\s]/gm, 3],
  ['I-3', '~다는 것이다', 1, /다는 (것|뜻)[이입]/g, 3],
  ['J-1', '** 볼드 남발', 1, /\*\*[^*\n]+\*\*/g, 5],
  ['J-3', '대시(—) 반복', 1, /—/g, 3],
]

// 코드 블록·HTML 태그·URL 은 빼고 셈
const clean = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')

export const hangul = (text: string): number => (text.match(/[가-힣]/g) ?? []).length

export const score = (path: string, raw: string): Report => {
  const text = clean(raw)
  const chars = hangul(text)
  const hits: Hit[] = RULES.flatMap(([id, label, weight, re, min]) => {
    const count = (text.match(re) ?? []).length
    return count >= min ? [{ id, label, weight, count }] : []
  }).sort((a, b) => b.weight * b.count - a.weight * a.count)

  // 한글 1000자당 가중 신호 수
  const points = hits.reduce((s, h) => s + h.weight * h.count, 0)
  const value = chars > 0 ? Math.round((points / chars) * 1000 * 10) / 10 : 0
  const grade = value < 4 ? '낮음' : value < 8 ? '보통' : '높음'
  return { path, chars, value, grade, hits }
}

import { expect, test } from 'claude-code/testing'
import { jevKind, parseJev } from '../hooks/jev'

test('jev.py 실행 명령만 골라 종류를 앎', async () => {
  expect(jevKind('python3 ~/.claude/skills/_shared/jev.py route "카드 3장 변환"')).toBe('route')
  expect(jevKind('cd x && python3 jev.py review ev.json --rubric r.json')).toBe('review')
  expect(jevKind('python3 jev.py selftest')).toBeUndefined()
  expect(jevKind('ls -la')).toBeUndefined()
  // 실제 실행이 아닌 글 속 문자열은 무시
  expect(jevKind("grep -n 'jev.py route' x.ts")).toBeUndefined()
  expect(jevKind("python3 - <<'EOF'\nprint('python3 jev.py route x')\nEOF")).toBeUndefined()
  expect(jevKind('cd ~/a && python3 ~/.claude/skills/_shared/jev.py route "x"')).toBe('route')
})

test('route 출력: 레인별 적합도·추천·확신도', async () => {
  const out = JSON.stringify({
    recommended: 'SMALL',
    confidence: 0.83,
    options: [
      { lane: 'SMALL', model: 'Haiku 5.5', effort: 'low', suitability: 81 },
      { lane: 'MEDIUM', model: 'Sonnet 5.5', effort: 'medium', suitability: 12 },
    ],
  })
  const j = parseJev('route', out, 5, 3)
  expect(j).toMatchObject({ kind: 'route', pick: 'SMALL', conf: 0.83, count: 3, t: 5 })
  expect(j.rows).toEqual([
    { label: 'SMALL · Haiku 5.5', p: 0.81 },
    { label: 'MEDIUM · Sonnet 5.5', p: 0.12 },
  ])
})

test('review 출력: 기준별 점수·판정, 앞뒤 글이 붙어도 JSON 만 읽음', async () => {
  const out = `Exit code 2\n${JSON.stringify({
    verdict: 'retry',
    score: 72,
    confidence: 0.7,
    criteria: [{ name: '후킹', score: 50 }, { name: '명확성', score: 100 }],
    human_review_reason: '',
  })}\n`
  const j = parseJev('review', out, 1, 1)
  expect(j).toMatchObject({ kind: 'review', verdict: 'retry', score: 72, conf: 0.7 })
  expect(j.rows).toEqual([{ label: '후킹', p: 0.5 }, { label: '명확성', p: 1 }])
  expect(j.note).toBeUndefined()
})

test('오류·못 읽은 출력은 error 상자', async () => {
  expect(parseJev('route', '{"error": "TYPESAFE_API_KEY 없음"}', 1, 1)).toMatchObject({ kind: 'error', note: 'TYPESAFE_API_KEY 없음' })
  expect(parseJev('route', 'Traceback ...', 1, 2)).toMatchObject({ kind: 'error', count: 2 })
})

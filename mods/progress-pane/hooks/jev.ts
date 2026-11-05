// Jev(jev.py) 실행 결과 → 흐름도 Jev 상자 데이터. 순수 함수
import type { Jev } from '../types'

// sharp 기준 — CLAUDE.md 의 위임 기준(confidence ≥ 0.6)과 같음
export const SHARP = 0.6

// Bash 명령이 jev.py route/review 실행인지 — 종류를 돌려줌
// 첫 줄의 명령 조각(;·&&·| 로 나뉜 것) 중 `[python3] …jev.py route|review` 로 시작하는 것만 — heredoc·grep 글 속 문자열은 무시
export const jevKind = (cmd: string): 'route' | 'review' | undefined => {
  const m = /(?:^|&&|\|\||;|\|)\s*(?:python3?\s+)?\S*jev\.py\s+(route|review)\b/.exec(cmd.split('\n')[0] ?? '')
  return m ? (m[1] as 'route' | 'review') : undefined
}

// 출력에서 JSON 덩어리만 꺼냄(앞뒤에 'Exit code 2' 같은 글이 붙어도)
const jsonOf = (text: string): Record<string, unknown> | undefined => {
  const a = text.indexOf('{')
  const b = text.lastIndexOf('}')
  if (a < 0 || b <= a) return undefined
  try {
    const v = JSON.parse(text.slice(a, b + 1))
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const str = (v: unknown) => (typeof v === 'string' ? v : undefined)

// jev.py 출력 → 상자 데이터. count 는 이번 실행을 포함한 누적 호출 수
export function parseJev(kind: 'route' | 'review', text: string, t: number, count: number): Jev {
  const o = jsonOf(text)
  if (!o) return { kind: 'error', t, count, rows: [], note: '결과를 읽지 못함' }
  if (str(o.error)) return { kind: 'error', t, count, rows: [], note: str(o.error) }
  if (kind === 'route') {
    const options = Array.isArray(o.options) ? (o.options as Record<string, unknown>[]) : []
    return {
      kind,
      t,
      count,
      rows: options.flatMap(x =>
        str(x.lane) ? [{ label: `${x.lane}${str(x.model) ? ` · ${x.model}` : ''}`, p: (num(x.suitability) ?? 0) / 100 }] : [],
      ),
      pick: str(o.recommended),
      conf: num(o.confidence),
    }
  }
  const criteria = Array.isArray(o.criteria) ? (o.criteria as Record<string, unknown>[]) : []
  return {
    kind,
    t,
    count,
    rows: criteria.flatMap(x => (str(x.name) ? [{ label: x.name as string, p: (num(x.score) ?? 0) / 100 }] : [])),
    verdict: str(o.verdict),
    score: num(o.score),
    conf: num(o.confidence),
    note: str(o.human_review_reason) || undefined,
  }
}

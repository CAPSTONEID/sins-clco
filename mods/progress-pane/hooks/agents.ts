import type { Session } from '../types'

// 끝난 세션 상태 — 삭제(claude rm) 대상, 그 외는 종료(claude stop) 대상
// ponytail: claude agents 의 state 값 목록이 문서화돼 있지 않아 관찰한 값 기준, 새 값은 '진행 중'으로 취급
const ENDED = new Set(['done', 'stopped', 'failed', 'exited', 'killed', 'error'])

// `claude agents --json --all` 출력 → 패널 행. self 는 이 세션의 sessionId(전체 UUID)
export const parseAgents = (json: string, self: string): Session[] => {
  let list: unknown
  try {
    list = JSON.parse(json)
  } catch {
    return []
  }
  if (!Array.isArray(list)) return []
  return list.flatMap((a: Record<string, unknown>) => {
    // 대화형 세션은 id·state 없이 sessionId·status 만 나옴 → 그걸로 대체
    const id = typeof a?.id === 'string' ? a.id : typeof a?.sessionId === 'string' ? a.sessionId : undefined
    if (!id) return []
    const cwd = typeof a.cwd === 'string' ? a.cwd : ''
    const state = typeof a.state === 'string' ? a.state : typeof a.status === 'string' ? a.status : '?'
    return [
      {
        id,
        pid: typeof a.pid === 'number' ? a.pid : undefined,
        name: typeof a.name === 'string' && a.name.trim() !== '' && a.name !== id ? a.name : '(이름 없음)',
        // 끝 슬래시가 있어도 마지막 폴더 이름만
        dir: cwd.split('/').filter(Boolean).pop() || cwd,
        kind: typeof a.kind === 'string' ? a.kind : '',
        state,
        startedAt: typeof a.startedAt === 'number' ? a.startedAt : 0,
        isEnded: ENDED.has(state),
        isSelf: a.sessionId === self,
      },
    ]
  })
}

// 시작 후 경과 — "방금" / "12분" / "3시간 5분" / "2일"
export const age = (ms: number): string => {
  if (!Number.isFinite(ms)) return '?'
  const m = Math.floor(Math.max(0, ms) / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}시간 ${m % 60}분` : `${Math.floor(h / 24)}일`
}

// 숨긴 세션 id 목록 기준으로 [보이는 세션, 숨긴 세션] 분리. 이 세션은 항상 보이는 쪽
export const splitHidden = (rows: Session[], hidden: string[]): [Session[], Session[]] => [
  rows.filter(x => x.isSelf || !hidden.includes(x.id)),
  rows.filter(x => !x.isSelf && hidden.includes(x.id)),
]

// 목록에 있으면 빼고, 없으면 넣음
export const toggle = (list: string[], id: string): string[] =>
  list.includes(id) ? list.filter(x => x !== id) : [...list, id]

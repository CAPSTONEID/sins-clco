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
    if (typeof a?.id !== 'string') return []
    const cwd = typeof a.cwd === 'string' ? a.cwd : ''
    const state = typeof a.state === 'string' ? a.state : '?'
    return [
      {
        id: a.id,
        name: typeof a.name === 'string' && a.name !== a.id ? a.name : '(이름 없음)',
        dir: cwd.split('/').pop() || cwd,
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
  const m = Math.floor(Math.max(0, ms) / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}시간 ${m % 60}분` : `${Math.floor(h / 24)}일`
}

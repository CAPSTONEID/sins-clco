import type { Run } from '../types'

// 스냅샷을 남길 최대 파일 크기 — 넘으면 롤백 대상에서 빠짐
export const SNAP_MAX = 1024 * 1024

// 턴 ID → 5글자 작업 ID (FNV-1a 해시, 0-9a-z)
export const shortId = (text: string): string => {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0
  return h.toString(36).padStart(5, '0').slice(-5)
}

// 대상 작업 "전" 상태로 되돌릴 계획: 대상 + 그 뒤 작업(hist 는 최신이 앞)이 고친 파일마다
// 가장 오래된 스냅샷을 씀. snap 이 null 이면 그 작업이 새로 만든 파일 → 삭제
// 가장 오래된 기록이 skip(사본 없음)이면 복원하지 않고 skipped 로 알림 — 더 나중 사본으로 덮지 않음
export const planRollback = (hist: Run[], targetId: string) => {
  const i = hist.findIndex(r => r.id === targetId)
  if (i < 0) return undefined
  const affected = hist.slice(0, i + 1).filter(r => !r.rolledBack)
  const restore = new Map<string, string | null>()
  const skipped: string[] = []
  const seen = new Set<string>()
  // 오래된 것부터 보며 처음 본 경로만 기록
  for (const r of [...affected].reverse()) {
    for (const f of r.files ?? []) {
      if (seen.has(f.path)) continue
      seen.add(f.path)
      if (f.skip) skipped.push(f.path)
      else restore.set(f.path, f.snap)
    }
  }
  return { restore, skipped, ids: affected.map(r => r.id) }
}

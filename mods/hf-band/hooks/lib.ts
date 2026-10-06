export const PREFIX = 'mcp__claude_ai_My_Higgsfield__'

// 크레딧을 쓰는 생성형 호출(작업 id 를 돌려줌)
const SUBMIT = /^(generate_\w+|execute_preset|motion_control|outpaint_image|upscale_\w+|remove_background|reframe|dubbing|voice_change|ads_studio_generate|ai_influencer_generate|shorts_studio_create)$/

export const isSubmit = (tool: string): boolean => SUBMIT.test(tool.slice(PREFIX.length))

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

export const ids = (text: string): string[] => [...new Set(text.match(UUID) ?? [])]

// 결과 텍스트에서 끝난 작업 id 찾기 — id 뒤 300자 안에 완료·실패 상태가 있으면 끝난 것으로 봄
// ponytail: 응답 포맷 휴리스틱, 틀리면 대기 건수가 남음 → 띠의 [비우기] 로 정리
export const finished = (text: string, pending: string[]): string[] =>
  pending.filter(id => {
    const at = text.indexOf(id)
    if (at < 0) return false
    return /(completed|failed|succeeded|nsfw|canceled|cancelled)/i.test(text.slice(at, at + 300))
  })

// balance 결과 {"credits":775.76,"subscription_plan_type":"ultimate"}
export const parseBalance = (text: string): { credits: number; plan: string } | undefined => {
  const credits = text.match(/"credits"\s*:\s*([\d.]+)/)
  if (!credits?.[1]) return undefined
  const plan = text.match(/"subscription_plan_type"\s*:\s*"([^"]+)"/)
  return { credits: Number(credits[1]), plan: plan?.[1] ?? '' }
}

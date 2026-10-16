export const PREFIX = 'mcp__claude_ai_My_Higgsfield__'

// 크레딧을 쓰는 생성형 호출(작업 id 를 돌려줌)
const SUBMIT = /^(generate_\w+|execute_preset|motion_control|outpaint_image|upscale_\w+|remove_background|reframe|dubbing|voice_change|ads_studio_generate|ai_influencer_generate|shorts_studio_create)$/

export const isSubmit = (tool: string): boolean => SUBMIT.test(tool.slice(PREFIX.length))

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

export const ids = (text: string): string[] => [...new Set(text.match(UUID) ?? [])]

// JSON status 값은 전체 일치, 텍스트 창은 단어 경계(`_`·`-` 도 단어의 일부)로 판별
const DONE = new Set(['completed', 'failed', 'succeeded', 'nsfw', 'canceled', 'cancelled'])
const DONE_TEXT = /(?<![\w-])(completed|failed|succeeded|nsfw|canceled|cancelled)(?![\w-])/i

// JSON(전체 또는 안쪽 배열·객체)을 걸어 다니며 항목 자신의 id → status 를 모음
// id·job_id 둘 다 등록하고, 바깥(먼저 만난) 객체가 안쪽 같은 id 보다 우선
const statuses = (text: string): { found: Map<string, string>; parsed: boolean } => {
  const found = new Map<string, string>()
  let parsed = false
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    const o = node as Record<string, unknown>
    if (typeof o.status === 'string') {
      for (const id of [o.id, o.job_id]) if (typeof id === 'string' && !found.has(id)) found.set(id, o.status)
    }
    Object.values(o).forEach(walk)
  }
  const start = text.search(/[[{]/)
  for (const s of [text, start > 0 ? text.slice(start) : '']) {
    try {
      walk(JSON.parse(s))
      parsed = true
      break
    } catch {
      // 파싱 실패 → 다음 후보, 모두 실패하면 아래 텍스트 창으로 판별
    }
  }
  return { found, parsed }
}

// 결과 텍스트에서 끝난 작업 id 찾기 — JSON 으로 파싱되면 항목 자신의 status 만 보고
// (자기 status 없는 id 는 끝난 게 아님, 텍스트 창 폴백 안 씀).
// 아니면 id 앞 `{` 부터 다음 "id" 키 또는 다른 대기 id 직전까지만 창으로 봄(이웃 작업 상태 침범 방지)
// ponytail: 응답 포맷 휴리스틱, 틀리면 대기 건수가 남음 → 띠의 [비우기] 로 정리
export const finished = (text: string, pending: string[]): string[] => {
  const { found, parsed } = statuses(text)
  return pending.filter(id => {
    const status = found.get(id)
    if (status !== undefined) return DONE.has(status.trim().toLowerCase())
    if (parsed) return false
    const at = text.indexOf(id)
    if (at < 0) return false
    // 앞쪽: id 가 "id"/"job_id" 키의 값일 때만 같은 항목의 `{` 까지 넓힘(status 가 id 앞에 온 경우).
    // 앞선 다른 id 키·다른 대기 id 는 넘지 않음
    const head = text.slice(0, at)
    const open = head.lastIndexOf('{')
    let back = at
    if (open >= 0 && /"(?:job_)?id"\s*:\s*"?$/.test(head)) {
      back = open
      const keys = [...head.slice(open).matchAll(/"(?:job_)?id"/g)]
      keys.pop() // 자기 키
      const prev = keys.at(-1)
      if (prev) back = open + prev.index + prev[0].length
      for (const o of pending) if (o !== id) back = Math.max(back, head.lastIndexOf(o) >= back ? head.lastIndexOf(o) + o.length : back)
    }
    const from = at + id.length
    const stops = [text.slice(from).search(/"(?:job_)?id"/), ...pending.filter(o => o !== id).map(o => text.indexOf(o, from) - from)]
    const end = Math.min(...stops.filter(n => n >= 0), text.length - from)
    return DONE_TEXT.test(text.slice(back, from + end))
  })
}

// balance 결과 {"credits":775.76,"subscription_plan_type":"ultimate"}
export const parseBalance = (text: string): { credits: number; plan: string } | undefined => {
  const credits = text.match(/"credits"\s*:\s*([\d.]+)/)
  if (!credits?.[1]) return undefined
  const plan = text.match(/"subscription_plan_type"\s*:\s*"([^"]+)"/)
  return { credits: Number(credits[1]), plan: plan?.[1] ?? '' }
}

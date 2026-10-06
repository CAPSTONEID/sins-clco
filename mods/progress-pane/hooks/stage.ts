export const STAGES = ['기획', '대본', '컷편집', '렌더', '썸네일', '업로드'] as const

// 도구 호출 하나에서 어떤 단계 신호인지 판별, 없으면 -1
// ponytail: 파일명·도구명 휴리스틱, 틀리면 /stage 로 직접 고치면 됨
const RULES: [number, (tool: string, path: string, cmd: string) => boolean][] = [
  [5, t => /tiktok_prepare_publish|publish_now|schedule_post|upload_media/.test(t)],
  [4, (t, p) => /thumb|썸네일/i.test(p) || /generate_image|outpaint_image|upscale_image/.test(t)],
  [3, (t, _p, c) => /hyperframes\S*\s+render|remotion\S*\s+render|(^|[\s/])ffmpeg\s/.test(c)],
  [2, t => /^mcp__palmier-pro__/.test(t)],
  [1, (t, p) => /^(Write|Edit)$/.test(t) && /대본|script|스크립트/i.test(p)],
  [0, (t, p) => /^(Write|Edit)$/.test(t) && /기획|brief|plan/i.test(p)],
]

export const detect = (tool: string, path: string, cmd: string): number =>
  RULES.find(([, test]) => test(tool, path, cmd))?.[0] ?? -1

// 작업 폴더 바로 아래 하위 폴더 이름 = 프로젝트, 아니면 작업 폴더 이름
export const project = (root: string, path: string): string => {
  const base = root.replace(/\/+$/, '')
  const name = base.split('/').pop() ?? base
  if (!path.startsWith(base + '/')) return name
  const rest = path.slice(base.length + 1).split('/')
  return rest.length > 1 && rest[0] ? rest[0] : name
}

// 상태줄 문구: "제작 · 프로젝트 | 기획 ✓  대본 ✓  ▶컷편집  렌더  썸네일  업로드"
export const line = (name: string, stage: number | undefined): string => {
  if (stage === undefined) return `제작 · ${name} | 단계 미지정 (/stage 기획)`
  const steps = STAGES.map((s, i) => (i < stage ? `${s} ✓` : i === stage ? `▶${s}` : s))
  return `제작 · ${name} | ${steps.join('  ')}`
}

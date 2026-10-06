export type Hit = { id: string; label: string; weight: number; count: number }

export type Report = {
  path: string
  // 한글 글자 수
  chars: number
  // 한글 1000자당 가중 신호 수
  value: number
  grade: '낮음' | '보통' | '높음'
  hits: Hit[]
}

declare module 'claude-code' {
  interface PluginState {
    'ai-tell': { last: Report | null }
  }
}

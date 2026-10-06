export type RenderJob = { pid: number; kind: string; command: string; seconds: number }

declare module 'claude-code' {
  interface PluginState {
    'progress-pane': {
      jobs: RenderJob[]
      history: Record<string, number[]>
      // 현재 프로젝트 이름과 프로젝트별 단계 번호
      project: string
      stages: Record<string, number>
    }
  }
}

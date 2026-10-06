export type RenderJob = { pid: number; kind: string; command: string; seconds: number }

export type Task = { id: string; subject: string; status: 'pending' | 'in_progress' | 'completed' }
export type Run = {
  id: string
  prompt: string
  label?: string
  startedAt: number
  endedAt?: number
  now: number
  tools: number
  lastTool: string
  tasks: Task[]
}

declare module 'claude-code' {
  interface PluginState {
    'progress-pane': {
      // 작업 진행 바: 지금 턴과 완료 기록
      run: Run | null
      runs: Run[]
      // 렌더 진행
      jobs: RenderJob[]
      renderHistory: Record<string, number[]>
      // 제작 단계: 현재 프로젝트 이름과 프로젝트별 단계 번호
      project: string
      stages: Record<string, number>
    }
  }
}

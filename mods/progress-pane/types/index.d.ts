export type Task = { id: string; subject: string; status: 'pending' | 'in_progress' | 'completed' }
export type Run = {
  startedAt: number
  endedAt?: number
  now: number
  tools: number
  lastTool: string
  tasks: Task[]
}

declare module 'claude-code' {
  interface PluginState {
    'progress-pane': { run: Run | null }
  }
}

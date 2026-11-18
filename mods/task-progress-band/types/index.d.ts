export type TaskStatus = 'pending' | 'in_progress' | 'completed'

declare module 'claude-code' {
  interface PluginState {
    'task-progress-band': {
      tasks: Record<string, TaskStatus>
      isHidden: boolean
    }
  }
}

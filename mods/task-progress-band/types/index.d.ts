export type TaskStatus = 'pending' | 'in_progress' | 'completed'

// 엔진이 알려주는 사용량 창 하나: five_hour, seven_day
export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

// 세션 컨텍스트 창: 마지막 응답의 입력 토큰, 창 크기, 사용률(%)
export type Ctx = { tokens?: number; window: number; percent?: number }

// 현재 모델 표시 이름과 추론 단계
export type ModelInfo = { name?: string; effort?: string | number }

declare module 'claude-code' {
  interface PluginState {
    'task-progress-band': {
      tasks: Record<string, TaskStatus>
      isHidden: boolean
      limits: Limit[]
      context: Ctx | null
      now: number
      isFresh: boolean
      model: ModelInfo
    }
  }
}

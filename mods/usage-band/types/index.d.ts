export type Gauge = { percent: number; detail: string; resetsAt?: string }
export type Snapshot = { context?: Gauge; fiveHour?: Gauge; sevenDay?: Gauge }
export type ModelInfo = { name?: string; effort?: string | number }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { snap: Snapshot; model: ModelInfo }
  }
}

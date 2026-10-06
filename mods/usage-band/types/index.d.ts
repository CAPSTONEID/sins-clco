export type Gauge = { percent: number; detail: string; resetsAt?: string }
export type Snapshot = { context?: Gauge; fiveHour?: Gauge; sevenDay?: Gauge }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { snap: Snapshot }
  }
}

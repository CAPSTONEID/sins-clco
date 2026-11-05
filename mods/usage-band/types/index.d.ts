export type Gauge = { percent: number; detail: string; resetsAt?: string }
export type Snapshot = { context?: Gauge; fiveHour?: Gauge; sevenDay?: Gauge }
// advisor: 어드바이저 모델 별칭(fable·opus), 없으면 꺼짐
export type ModelInfo = { name?: string; effort?: string | number; advisor?: string }
// 모드 배지: 값 = 강도(full·lite·ultra 등), undefined = 꺼짐
export type Modes = { ponytail?: string; caveman?: string; humanize?: string }
// Model·Effort 이름 클릭 시 펼치는 선택 줄: 없으면 닫힘
export type Picker = 'model' | 'effort' | 'advisor' | null

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { snap: Snapshot; model: ModelInfo; beside: boolean; modes: Modes; picker: Picker; subsOpen: boolean }
  }
}

export type Gauge = { percent: number; detail: string; resetsAt?: string }
// isStale: 이번 세션 응답 전이라 지난 세션이 저장한 한도 값으로 그리는 중
export type Snapshot = { context?: Gauge; fiveHour?: Gauge; sevenDay?: Gauge; isStale?: boolean }
// advisor: 어드바이저 모델 별칭(fable·opus), 없으면 꺼짐
export type ModelInfo = { name?: string; effort?: string | number; advisor?: string }
// 모드 배지: 값 = 강도(full·lite·ultra 등), undefined = 꺼짐
export type Modes = { ponytail?: string; caveman?: string; humanize?: string }
// Model·Effort 이름 클릭 시 펼치는 선택 줄: 없으면 닫힘
export type Picker = 'model' | 'effort' | 'advisor' | null
// ponytail 플러그인 밴드 값 중 Ponytail save 줄이 읽는 칸만. dependencies 없이 읽어서 ponytail 이 없으면 값이 없고 줄도 안 그림
export type PonytailBand = { level?: string; spent?: number; turnCosts?: number[]; busyMs?: number }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { snap: Snapshot; model: ModelInfo; beside: boolean; modes: Modes; picker: Picker; subsOpen: boolean; ptOpen: boolean }
    ponytail: { band: PonytailBand }
  }
}

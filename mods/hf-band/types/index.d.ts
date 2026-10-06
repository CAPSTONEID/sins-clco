export type HfInfo = {
  credits: number | null
  plan: string
  // 이번 세션 생성 요청 건수
  submitted: number
  // 완료 확인 전 작업 id
  pending: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'hf-band': { info: HfInfo; isHidden: boolean }
  }
}

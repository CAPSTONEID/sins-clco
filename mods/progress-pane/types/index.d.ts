export type RenderJob = { pid: number; kind: string; command: string; seconds: number }

// 에이전트 관제: Claude 세션(claude agents --json --all 기준)
export type Session = {
  id: string
  // 프로세스 id — 대화형 세션 종료(kill)에 사용
  pid?: number
  name: string
  dir: string
  kind: string
  state: string
  startedAt: number
  isEnded: boolean
  isSelf: boolean
}
// 이 세션의 서브에이전트($.agent.list)
export type AgentRow = { id: string; type: string; description: string; status: string }
// 서브에이전트 작업 상태: 시작·끝 시각, 도구 사용 횟수, 마지막 도구
export type SubStat = { startedAt: number; endedAt?: number; tools: number; lastTool: string }

export type Task = { id: string; subject: string; status: 'pending' | 'in_progress' | 'completed' }
// 작업이 고친 파일: snap 은 고치기 전 원본 사본 경로, null 이면 작업 전엔 없던 파일
// skip 이면 사본을 못 남긴 파일(1MB 초과·폴더·링크) — 롤백 때 건드리지 않음
export type FileSnap = { path: string; snap: string | null; skip?: true }

export type Run = {
  id: string
  // 5글자 작업 ID (#a3f9k)
  rid?: string
  // 이 작업이 처음 고친 파일들(롤백용)
  files?: FileSnap[]
  // 롤백으로 되돌려진 작업
  rolledBack?: boolean
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
      // 에이전트 관제
      agents: AgentRow[]
      // 서브에이전트 id → 실행 모델·추론값(effort 미지정이면 없음 = 기본)
      subMeta: Record<string, { model: string; effort?: string }>
      // 서브에이전트 id → 작업 상태 (3초 폴링 때만 기록 — 도구마다 다시 그리지 않게)
      subStats: Record<string, SubStat>
      sessions: Session[]
      // 숨긴 세션 id ($.store 'hidden-agents' 에도 저장)
      hidden: string[]
      // 확인 대기 중인 항목 ('a:<agentId>#종료' | 's:<세션 id>#종료|삭제' | 'rb:<작업 id>#…')
      confirm: string | null
      // 제목을 눌러 전체 내용을 펼친 항목 키
      expanded: string[]
      // 보고 있는 탭
      tab: 'now' | 'history'
    }
  }
}

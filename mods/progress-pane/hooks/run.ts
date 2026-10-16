// 작업 진행 바 표시용 순수 함수 (기존 progress-pane 에서 옮김)

export const BAR = 30

// 막대 그라데이션 (usage-band와 같은 청록→보라)
const FROM = [31, 181, 201]
const TO = [168, 85, 247]
export const mix = (t: number) => {
  // 0~1 밖이면 색 코드가 깨지므로 범위 고정
  const k = Math.min(1, Math.max(0, t))
  return '#' + FROM.map((v, i) => Math.round(v + ((TO[i] ?? v) - v) * k).toString(16).padStart(2, '0')).join('')
}

// 경과 시간 → "2분 14초"
export const dur = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return m ? `${m}분 ${s % 60}초` : `${s}초`
}

// 모델 id → 짧은 이름: claude-haiku-5-5 → haiku 5.5
export const shortModel = (id: string) => id.replace(/^claude-/, '').replace(/-(\d+)-(\d+)(?=\b|\[|$)/, ' $1.$2')

// 기본 최대 글자 수(… 앞까지)
export const TITLE_MAX = 20

// 화면에 보이는 한 글자 단위로 나눔 — 국기·피부색·가족 이모지도 한 글자
// ponytail: Intl.Segmenter 없는 환경이면 코드포인트 기준(이모지 조합이 쪼개질 수 있음)
const graphemes = (text: string): string[] =>
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), x => x.segment)
    : [...text]

// max 글자까지 남기고 잘렸으면 … 표시 (이모지·한글도 한 글자로 셈)
export const clip = (text: string, max = TITLE_MAX) => {
  const chars = graphemes(text)
  return chars.length > Math.max(0, max) ? `${chars.slice(0, Math.max(0, max)).join('')}…` : text
}

// 사용자가 아닌 자동 메시지로 시작한 턴의 제목 (원문 태그 대신)
const AUTO: [RegExp, string][] = [
  [/^<agent-message\b/, '서브에이전트 보고 처리'],
  [/^<task-notification\b/, '백그라운드 작업 알림 처리'],
  [/^<side-sessions-event\b/, '다른 세션 결과 처리'],
]

// 요약 전 임시 설명: 프롬프트 첫 줄 (자동 메시지면 정해 둔 이름)
export const fallback = (text: string) => {
  const t = text.trim()
  const auto = AUTO.find(([re]) => re.test(t))
  if (auto) return auto[1]
  return clip((t.split(/\r?\n/)[0] ?? '').trim()) || '작업'
}

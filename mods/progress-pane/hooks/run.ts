// 작업 진행 바 표시용 순수 함수 (기존 progress-pane 에서 옮김)

export const BAR = 30

// 막대 그라데이션 (usage-band와 같은 청록→보라)
const FROM = [31, 181, 201]
const TO = [168, 85, 247]
export const mix = (t: number) =>
  '#' + FROM.map((v, i) => Math.round(v + ((TO[i] ?? v) - v) * t).toString(16).padStart(2, '0')).join('')

// 경과 시간 → "2분 14초"
export const dur = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return m ? `${m}분 ${s % 60}초` : `${s}초`
}

// 기본 최대 글자 수(… 앞까지)
export const TITLE_MAX = 20

// max 글자까지 남기고 잘렸으면 … 표시 (이모지·한글도 한 글자로 셈)
export const clip = (text: string, max = TITLE_MAX) => {
  const chars = [...text]
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : text
}

// 요약 전 임시 설명: 프롬프트 첫 줄
export const fallback = (text: string) => clip(text.trim().split('\n')[0] ?? '') || '작업'

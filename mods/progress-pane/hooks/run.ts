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

// 요약 전 임시 설명: 프롬프트 첫 줄 20자
export const fallback = (text: string) => {
  const line = text.trim().split('\n')[0] ?? ''
  return line.length > 20 ? `${line.slice(0, 20)}…` : line || '작업'
}

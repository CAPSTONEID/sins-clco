// 진행 탭 흐름도(데스크톱)를 네온 SVG 로 그리는 순수 함수
// 다크 네이비 카드 + 모델 색 네온 테두리(작업 중엔 은은한 빛번짐) + 세로 레일로 이어지는 흐름
// 데스크톱은 Svg 를 이미지로 그림: 글꼴은 시스템 글꼴만, 줄바꿈 없음 → 글자 폭을 추정해 직접 … 로 자름

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Apple SD Gothic Neo', 'Helvetica Neue', sans-serif"
const MONO = "'SF Mono', Menlo, Monaco, monospace"
const CARD_BG = '#0f1631'
const TRACK = '#1c2547'
const LINE_OFF = '#2e3a63'

// SVG 글자 안전하게
export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

// 글자 폭 추정(px) — 한글·한자·이모지는 글자 크기만큼, 영문은 대략 0.55배
const wide = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]|\p{Extended_Pictographic}/u
const charW = (ch: string, size: number, mono: boolean) => {
  if (wide.test(ch)) return size
  if (mono) return size * 0.6
  if (ch === ' ') return size * 0.28
  if (/[A-Z]/.test(ch)) return size * 0.66
  if (/[0-9]/.test(ch)) return size * 0.58
  if (/[a-z]/.test(ch)) return size * 0.53
  return size * 0.4
}
export const textW = (s: string, size: number, bold = false, mono = false) =>
  [...s].reduce((w, ch) => w + charW(ch, size, mono), 0) * (bold && !mono ? 1.06 : 1)

// 최대 폭(px)에 맞춰 자르고 … 표시
export const fit = (s: string, max: number, size: number, bold = false, mono = false) => {
  if (textW(s, size, bold, mono) <= max) return s
  let out = ''
  for (const ch of s) {
    if (textW(`${out}${ch}…`, size, bold, mono) > max) break
    out += ch
  }
  return `${out}…`
}

// 한 줄을 이루는 조각: 왼쪽부터 이어 그림(right 는 오른쪽 끝 정렬)
export type Span = { text: string; color: string; bold?: boolean; glow?: boolean; mono?: boolean; size?: number }
// 카드 한 줄: 글자 줄 · 진행 막대 · 단계 칸(effort)
export type Row =
  | { kind: 'text'; spans: Span[]; right?: Span; size?: number }
  | { kind: 'bar'; pct?: number; phase?: number; from: string; to: string; label?: Span; value?: Span; labelW?: number }
  | { kind: 'pills'; n: number; on: number; from: string; to: string; before?: Span; after?: Span }

const DEFS = (accent: string) =>
  `<defs>` +
  `<filter id="glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
  `<filter id="soft" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
  `<filter id="halo" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>` +
  `<filter id="tglow" x="-5%" y="-60%" width="110%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>` +
  `<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${accent}" stop-opacity="0.10"/><stop offset="0.6" stop-color="${accent}" stop-opacity="0"/></linearGradient>` +
  `</defs>`

const ROW_H = { text: 21, bar: 18, pills: 21 } as const
const rowH = (r: Row) => (r.kind === 'text' && (r.size ?? 12.5) > 13 ? 24 : ROW_H[r.kind])

// 글자 조각들을 x 부터 이어 그림, 남는 폭(max)을 넘으면 마지막 조각을 … 로 자름
const spansSvg = (spans: Span[], x: number, y: number, max: number, base: number) => {
  let cx = x
  let out = ''
  for (const s of spans) {
    const size = s.size ?? base
    const room = x + max - cx
    if (room <= size) break
    const t = fit(s.text, room, size, s.bold, s.mono)
    const attrs = `x="${cx.toFixed(1)}" y="${y}" font-family="${s.mono ? MONO : FONT}" font-size="${size}"${s.bold ? ' font-weight="700"' : ''} fill="${s.color}"`
    // 네온 글자: 흐린 빛 사본을 깔고 위에 또렷한 글자
    if (s.glow) out += `<text ${attrs} opacity="0.85" filter="url(#tglow)">${esc(t)}</text>`
    out += `<text ${attrs}>${esc(t)}</text>`
    cx += textW(t, size, s.bold, s.mono)
  }
  return out
}

// 둥근 막대: 트랙 + 그라디언트 채움(빛번짐). pct 없으면 흐르는 덩어리(진행률 모를 때)
let gid = 0
const barSvg = (x: number, y: number, w: number, h: number, pct: number | undefined, phase: number, from: string, to: string) => {
  const id = `bg${gid++}`
  const grad = `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x}" y1="0" x2="${x + w}" y2="0"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`
  const track = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${TRACK}"/>`
  let fill = ''
  if (pct !== undefined) {
    const fw = Math.max(pct > 0 ? h : 0, Math.round(Math.min(1, Math.max(0, pct)) * w))
    if (fw > 0) fill = `<rect x="${x}" y="${y}" width="${fw}" height="${h}" rx="${h / 2}" fill="url(#${id})" filter="url(#soft)"/>`
  } else {
    // 진행률 모름: 폭 28% 덩어리가 1초마다 한 칸씩 흐름
    const cw = Math.round(w * 0.28)
    const steps = 10
    const cx = x + Math.round(((phase % steps) / (steps - 1)) * (w - cw))
    fill = `<rect x="${cx}" y="${y}" width="${cw}" height="${h}" rx="${h / 2}" fill="url(#${id})" filter="url(#soft)"/>`
  }
  return `<defs>${grad}</defs>${track}${fill}`
}

// 단계 칸(알약 n개 중 on 개 채움)
const pillsSvg = (x: number, y: number, n: number, on: number, from: string, to: string) => {
  const pw = 14
  const gap = 3
  const h = 7
  const id = `pg${gid++}`
  const w = n * pw + (n - 1) * gap
  const grad = `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x}" y1="0" x2="${x + w}" y2="0"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`
  const cells = Array.from({ length: n }, (_, i) =>
    `<rect x="${x + i * (pw + gap)}" y="${y}" width="${pw}" height="${h}" rx="${h / 2}" fill="${i < on ? `url(#${id})` : TRACK}"${i < on ? ' filter="url(#soft)"' : ''}/>`,
  ).join('')
  return { svg: `<defs>${grad}</defs>${cells}`, w }
}

// 카드: 다크 상자 + 테두리(lit 이면 네온 빛번짐) + 줄들
// corner: 마지막 줄 오른쪽 끝에 네온 ✕ 아이콘(그 자리 위에 투명 버튼을 겹쳐 누름)
export const cardSvg = (o: { w: number; accent: string; lit: boolean; rows: Row[]; dim?: boolean; corner?: string }) => {
  const M = 6 // 빛번짐이 잘리지 않게 바깥 여백
  const PX = 14
  const PY = 12
  const inner = o.w - M * 2 - PX * 2
  const h = M * 2 + PY * 2 + o.rows.reduce((s, r) => s + rowH(r), 0) - 4
  const stroke = o.lit ? o.accent : LINE_OFF
  let y = M + PY
  let body = ''
  for (const r of o.rows) {
    const rh = rowH(r)
    const base = r.kind === 'text' ? (r.size ?? 12.5) : 12
    const ty = y + rh - 7
    if (r.kind === 'text') {
      const rightW = r.right ? textW(r.right.text, r.right.size ?? base, r.right.bold, r.right.mono) + 10 : 0
      body += spansSvg(r.spans, M + PX, ty, inner - rightW, base)
      if (r.right)
        body += spansSvg([r.right], M + PX + inner - rightW + 10, ty, rightW, base)
    } else if (r.kind === 'bar') {
      const lw = r.label ? (r.labelW ?? textW(r.label.text, 12) + 8) : 0
      const vw = r.value ? Math.max(42, textW(r.value.text, 12, r.value.bold) + 10) : 0
      if (r.label) body += spansSvg([r.label], M + PX, ty, lw - 6, 12)
      body += barSvg(M + PX + lw, y + rh / 2 - 3.5, Math.max(20, inner - lw - vw), 7, r.pct, r.phase ?? 0, r.from, r.to)
      if (r.value) {
        const v = r.value
        body += `<text x="${M + PX + inner}" y="${ty}" text-anchor="end" font-family="${FONT}" font-size="12"${v.bold ? ' font-weight="700"' : ''} fill="${v.color}">${esc(v.text)}</text>`
      }
    } else {
      let cx = M + PX
      if (r.before) {
        body += spansSvg([r.before], cx, ty, inner, 12.5)
        cx += textW(r.before.text, 12.5) + 8
      }
      const p = pillsSvg(cx, y + rh / 2 - 4.5, r.n, r.on, r.from, r.to)
      body += p.svg
      cx += p.w + 8
      if (r.after) body += spansSvg([r.after], cx, ty, M + PX + inner - cx, 12.5)
    }
    y += rh
  }
  if (o.corner) {
    const last = o.rows[o.rows.length - 1]
    const cy = y - (last ? rowH(last) : 0) / 2
    const cx = M + PX + inner - 8
    body +=
      `<circle cx="${cx}" cy="${cy}" r="7.5" fill="${CARD_BG}" stroke="${o.corner}" stroke-width="1.2" filter="url(#soft)"/>` +
      `<path d="M${cx - 2.6} ${cy - 2.6} L${cx + 2.6} ${cy + 2.6} M${cx + 2.6} ${cy - 2.6} L${cx - 2.6} ${cy + 2.6}" stroke="${o.corner}" stroke-width="1.5" stroke-linecap="round"/>`
  }
  const x0 = M
  const w0 = o.w - M * 2
  const h0 = h - M * 2
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.w}" height="${h}" viewBox="0 0 ${o.w} ${h}">` +
    DEFS(o.accent) +
    (o.lit ? `<rect x="${x0}" y="${M}" width="${w0}" height="${h0}" rx="12" fill="none" stroke="${o.accent}" stroke-width="3" opacity="0.55" filter="url(#halo)"/>` : '') +
    `<rect x="${x0}" y="${M}" width="${w0}" height="${h0}" rx="12" fill="${CARD_BG}"${o.dim ? ' fill-opacity="0.7"' : ''}/>` +
    (o.lit ? `<rect x="${x0}" y="${M}" width="${w0}" height="${h0}" rx="12" fill="url(#sheen)"/>` : '') +
    `<rect x="${x0 + 0.75}" y="${M + 0.75}" width="${w0 - 1.5}" height="${h0 - 1.5}" rx="11.5" fill="none" stroke="${stroke}" stroke-width="1.5"${o.lit ? '' : ' stroke-opacity="0.9"'}/>` +
    body +
    `</svg>`
  )
}

// 세로 레일 + 가운데 알약 라벨 — lit 이면 네온 선 위로 빛 점이 내려감(1초마다 다음 위치)
export const railSvg = (o: { w: number; color: string; lit: boolean; phase: number; label?: Span[]; h?: number }) => {
  const H = o.h ?? (o.label ? 64 : 30)
  const x = Math.round(o.w / 2)
  const pillH = 22
  const lab = o.label ?? []
  const labW = lab.length ? lab.reduce((s, t) => s + textW(t.text, 11.5, t.bold), 0) + 30 : 0
  const pw = Math.min(o.w - 12, labW)
  const py = H / 2 - pillH / 2
  const seg = (y1: number, y2: number) =>
    o.lit
      ? `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${o.color}" stroke-width="2" stroke-linecap="round" filter="url(#rail)" opacity="0.9"/>`
      : `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${LINE_OFF}" stroke-width="1.5" stroke-dasharray="2 4" stroke-linecap="round"/>`
  const lines = lab.length ? seg(2, py) + seg(py + pillH, H - 2) : seg(2, H - 2)
  // 빛 점: 위→아래 4칸
  const dotY = 4 + ((o.phase % 4) / 3) * (H - 8)
  const dot = o.lit && !(lab.length && dotY > py - 2 && dotY < py + pillH + 2)
    ? `<circle cx="${x}" cy="${dotY.toFixed(1)}" r="3.2" fill="#ffffff" filter="url(#glow)"/><circle cx="${x}" cy="${dotY.toFixed(1)}" r="5" fill="${o.color}" opacity="0.45" filter="url(#halo)"/>`
    : ''
  const pill = lab.length
    ? `<rect x="${x - pw / 2}" y="${py}" width="${pw}" height="${pillH}" rx="${pillH / 2}" fill="${CARD_BG}" stroke="${o.lit ? o.color : LINE_OFF}" stroke-width="1.2"${o.lit ? ' filter="url(#soft)"' : ''}/>` +
      spansSvg(lab.map(t => ({ ...t, size: 11.5 })), x - pw / 2 + 12, py + 15, pw - 24, 11.5)
    : ''
  // 세로선은 폭이 0 이라 상자 기준 필터 영역이 비어 빛이 안 그려짐 → 그림 전체 좌표로 영역 지정
  const rail = `<defs><filter id="rail" filterUnits="userSpaceOnUse" x="0" y="0" width="${o.w}" height="${H}"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${o.w}" height="${H}" viewBox="0 0 ${o.w} ${H}">${DEFS(o.color)}${rail}${lines}${dot}${pill}</svg>`
}

// 알약 줄(범례·하단 상태): ■ 이름 · 역할 / 이름 [값] — 폭을 넘으면 다음 줄
export type Chip = { dot?: string; parts: Span[] }
export const chipsSvg = (w: number, chips: Chip[]) => {
  const H = 24
  const gap = 8
  let x = 6
  let y = 4
  let out = ''
  for (const c of chips) {
    const tw = c.parts.reduce((s, p) => s + textW(p.text, 11.5, p.bold), 0)
    const cw = tw + (c.dot ? 30 : 20)
    if (x + cw > w - 6 && x > 6) {
      x = 6
      y += H + 6
    }
    out += `<rect x="${x}" y="${y}" width="${cw}" height="${H}" rx="${H / 2}" fill="${CARD_BG}" stroke="${LINE_OFF}" stroke-width="1"/>`
    let cx = x + 10
    if (c.dot) {
      out += `<rect x="${cx}" y="${y + H / 2 - 4}" width="8" height="8" rx="2" fill="${c.dot}" filter="url(#soft)"/>`
      cx += 14
    }
    out += spansSvg(c.parts.map(p => ({ ...p, size: 11.5 })), cx, y + 16, w - cx - 6, 11.5)
    x += cw + gap
  }
  const h = y + H + 4
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DEFS('#ffffff')}${out}</svg>`
}

// 카드 여러 장을 한 줄 그림으로: 각 카드 SVG 를 x 위치에 끼워 넣음(같은 id 가 겹치지 않게 카드마다 꼬리표)
export const rowSvg = (w: number, cards: string[]) => {
  const n = Math.max(1, cards.length)
  const cw = w / n
  const parts = cards.map((c, i) => {
    const tag = `c${i}`
    const body = c
      .replace(/id="([\w-]+)"/g, `id="$1-${tag}"`)
      .replace(/url\(#([\w-]+)\)/g, `url(#$1-${tag})`)
    const h = Number(/height="([\d.]+)"/.exec(c)?.[1] ?? 0)
    return { svg: body.replace(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, `<svg x="${(i * cw).toFixed(1)}" y="0"`), h }
  })
  const h = Math.max(0, ...parts.map(p => p.h))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.map(p => p.svg).join('')}</svg>`
}

// 이음선: 위 점들(from)에서 내려와 가로줄을 타고 아래 점들(to)로 내려감
// 메인→카드 첫 줄(점 1개→여러 개), 카드 줄→다음 카드 줄(여러 개→여러 개), 마지막 줄→리드 복귀(여러 개→1개)
// lit 이면 네온 선 + 빛 점이 1초마다 경로를 따라 이동: 위 세로선 → 가로줄 → 아래 세로선
export const linkSvg = (o: { w: number; from: number[]; to: number[]; lit: boolean; color: string; phase: number }) => {
  const H = 36
  const mid = H / 2
  const xs = [...o.from, ...o.to]
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  const d = [
    ...o.from.map(x => `M${x} 0 L${x} ${mid}`),
    hi > lo ? `M${lo} ${mid} L${hi} ${mid}` : '',
    ...o.to.map(x => `M${x} ${mid} L${x} ${H}`),
  ].join(' ')
  const line = o.lit
    ? `<path d="${d}" fill="none" stroke="${o.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#lk)" opacity="0.9"/>`
    : `<path d="${d}" fill="none" stroke="${LINE_OFF}" stroke-width="1.5" stroke-dasharray="2 4" stroke-linecap="round"/>`
  // 빛 점 6단계: 0~1 위 세로선(위 점들의 가운데에서), 2~3 가로줄(가운데 → 각 아래 점), 4~5 아래 세로선
  const k = o.phase % 6
  const fc = o.from.reduce((s, x) => s + x, 0) / Math.max(1, o.from.length)
  const pts: [number, number][] =
    k < 2
      ? o.from.map(x => [x, (k / 2) * mid + 3])
      : k < 4
        ? o.to.map(x => [fc + (x - fc) * ((k - 1) / 3), mid])
        : o.to.map(x => [x, mid + ((k - 3) / 3) * (H - mid - 2)])
  const dots = o.lit
    ? pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${o.color}" opacity="0.5" filter="url(#lk2)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#ffffff"/>`).join('')
    : ''
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.w}" height="${H}" viewBox="0 0 ${o.w} ${H}">` +
    `<defs><filter id="lk" filterUnits="userSpaceOnUse" x="0" y="0" width="${o.w}" height="${H}"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    `<filter id="lk2" filterUnits="userSpaceOnUse" x="0" y="0" width="${o.w}" height="${H}"><feGaussianBlur stdDeviation="3"/></filter></defs>` +
    line + dots + `</svg>`
  )
}

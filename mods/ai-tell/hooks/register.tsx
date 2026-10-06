import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Report } from '../types'
import { hangul, score } from './lib'

const PANE = 'ai-tell'
const last = atom({ plugin: 'ai-tell', key: 'last' } as const, null as Report | null)
// 검사 대상: 글 파일만
const TEXT_FILE = /\.(md|txt)$/i
// 한글 300자 미만은 점수가 흔들려서 건너뜀
const MIN_CHARS = 300

// 파일을 읽어 점수 계산 → 상태 갱신·알림, 한글이 적으면 undefined
async function check($: EngineInterface, path: string, isQuiet: boolean): Promise<Report | undefined> {
  const text = await $.fs.read(path)
  if (typeof text !== 'string' || hangul(text) < MIN_CHARS) return undefined
  const report = score(path, text)
  await update($, last, () => report)
  if (!isQuiet || report.grade !== '낮음') {
    const top = report.hits.slice(0, 3).map(h => `${h.label} ${h.count}`).join(', ')
    $.ui.toast(`AI 티 ${report.value}점(${report.grade})${top ? ` · ${top}` : ''} · /aitell`, { timeoutMs: 8000 })
  }
  return report
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'aitell',
      description: 'AI 티 점수 창 열기 (경로를 주면 그 파일 검사)',
      argumentHint: '[파일 경로]',
    })
    return next(e)
  })

  on('command.run', { command: 'aitell' }, async ($, e) => {
    const path = e.args.trim()
    if (path) {
      const report = await check($, path, false).catch(() => undefined)
      if (!report) return { text: `${path}: 읽을 수 없거나 한글 ${MIN_CHARS}자 미만입니다.` }
    }
    await $.ui.open({ id: PANE, title: 'AI 티 점수' })
    const r = await read($, last)
    return { text: r ? `${r.path}: ${r.value}점(${r.grade})` : '아직 검사한 파일이 없습니다.' }
  })

  // Write·Edit 로 글 파일이 저장되면 자동 검사
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (e.tool !== 'Write' && e.tool !== 'Edit') return ran
    if (ran.deny !== undefined || ran.isError || !TEXT_FILE.test(e.file_path)) return ran
    await check($, e.file_path, true).catch(() => undefined)
    return ran
  }).catch(($, e, next) => next(e)) // 검사가 실패해도 저장은 그대로

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const r = await read($, last)
    if (!r) return <Text dimColor>.md/.txt 파일을 저장하면 여기 점수가 뜹니다.</Text>

    const color = r.grade === '높음' ? 'red' : r.grade === '보통' ? 'yellow' : 'green'
    return (
      <Box flexDirection="column">
        <Text dimColor>{r.path.split('/').slice(-2).join('/')}</Text>
        <Text bold color={color}>
          {r.value}점 · {r.grade}
        </Text>
        <Text dimColor>한글 {r.chars}자 기준, 1000자당 가중 신호 수 (4 미만 낮음, 8 이상 높음)</Text>
        <Text> </Text>
        {r.hits.length === 0 && <Text>걸린 패턴 없음</Text>}
        {r.hits.map(h => (
          <Text>
            {h.id.padEnd(5)} {h.label} × {h.count}
            {h.weight > 1 ? ' (S1)' : ''}
          </Text>
        ))}
        {r.grade !== '낮음' && (
          <Box marginTop={1}>
            <Text dimColor>→ /humanize-korean 으로 윤문 권장</Text>
          </Box>
        )}
      </Box>
    )
  })
}

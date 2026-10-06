import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HfInfo } from '../types'
import { PREFIX, finished, ids, isSubmit, parseBalance } from './lib'

const EMPTY: HfInfo = { credits: null, plan: '', submitted: 0, pending: [] }
const info = atom({ plugin: 'hf-band', key: 'info' } as const, EMPTY)
const isHidden = atom({ plugin: 'hf-band', key: 'isHidden' } as const, false)

// Higgsfield balance 도구를 직접 호출해 크레딧 갱신, 실패하면 이전 값 유지
async function refresh($: EngineInterface): Promise<void> {
  try {
    const res = await $.mcp.call('claude_ai_My_Higgsfield', 'balance')
    const text = res.content.map(b => ('text' in b ? String(b.text) : '')).join('')
    const got = parseBalance(text)
    if (got) await update($, info, v => ({ ...v, credits: got.credits, plan: got.plan }))
  } catch {
    // 서버 미연결 등 — 띠에 '?' 로 남김
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    void refresh($)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    const tool = String(e.tool)
    if (!tool.startsWith(PREFIX) || ran.deny !== undefined) return ran

    const text = ran.text ?? ''
    if (isSubmit(tool) && !ran.isError) {
      const got = ids(text)
      await update($, info, v => ({
        ...v,
        submitted: v.submitted + 1,
        pending: [...new Set([...v.pending, ...got])].slice(-50),
      }))
      void refresh($)
    } else {
      const v = await read($, info)
      const done = finished(text, v.pending)
      if (done.length > 0) {
        await update($, info, cur => ({ ...cur, pending: cur.pending.filter(id => !done.includes(id)) }))
        $.ui.toast(`Higgsfield 작업 ${done.length}건 완료`)
        void refresh($)
      }
    }
    return ran
  }).catch(($, e, next) => next(e)) // 띠 갱신이 실패해도 도구 호출은 그대로

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const v = await read($, info)
    if (e.props.hasSurvey || (await read($, isHidden)) || (v.credits === null && v.submitted === 0)) {
      return next(e)
    }
    const { Box, Button, Text } = $.ui.resolve(e)
    const credits = v.credits === null ? '?' : v.credits.toLocaleString('en-US')

    return (
      <Box>
        <Text color="magenta">Higgsfield </Text>
        <Text>
          크레딧 {credits}
          {v.plan ? ` (${v.plan})` : ''} · 이번 세션 요청 {v.submitted}건 · 대기 {v.pending.length}건{' '}
        </Text>
        <Button key="refresh" label="새로고침" onPress={() => refresh($)} />
        {v.pending.length > 0 && (
          <Button key="clear" label="비우기" onPress={() => update($, info, cur => ({ ...cur, pending: [] }))} />
        )}
        <Button key="hide" label="숨기기" onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}

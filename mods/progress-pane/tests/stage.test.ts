import { expect, test } from 'claude-code/testing'
import { detect, line, project } from '../hooks/stage'

test('도구 호출로 제작 단계를 판별하고 프로젝트명을 뽑음', async () => {
  expect(detect('Write', '/r/영상A/대본.md', '')).toBe(1)
  expect(detect('mcp__palmier-pro__remove_silence', '', '')).toBe(2)
  expect(detect('Bash', '', 'ffmpeg -i a.mp4 b.mp4')).toBe(3)
  expect(detect('mcp__claude_ai_My_Higgsfield__generate_image', '', '')).toBe(4)
  expect(detect('Read', '/r/x.md', '')).toBe(-1)
  expect(project('/r', '/r/영상A/대본.md')).toBe('영상A')
  expect(project('/r', '/r/a.md')).toBe('r')
  expect(line('영상A', 2)).toBe('제작 · 영상A | 기획 ✓  대본 ✓  ▶컷편집  렌더  썸네일  업로드')
})

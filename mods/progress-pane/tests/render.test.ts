import { expect, test } from 'claude-code/testing'
import { average, fmt, parseEtime, parsePs, percent } from '../hooks/render'

test('ps 출력에서 렌더 프로세스만 추리고 경과 시간을 초로 변환', async () => {
  const out = [
    '  101     1 01:02:03 /opt/homebrew/bin/ffmpeg -i a.mp4 b.mp4',
    '  102     1 1-00:00:05 npx hyperframes render --out x.mp4',
    '  103     1 00:10 /usr/libexec/logd',
  ].join('\n')
  const jobs = parsePs(out)
  expect(jobs.map(j => j.kind)).toEqual(['ffmpeg', 'hyperframes'])
  expect(jobs[0]?.seconds).toBe(3723)
  expect(parseEtime('1-00:00:05')).toBe(86405)

  // npx 렌더: npm exec → sh → node hyperframes → ffmpeg 가 렌더 1건으로 묶여야 함
  const nested = parsePs([
    '  200   199 05:00 npm exec hyperframes render --output final.mp4',
    '  199     1 05:00 /bin/zsh -c source ~/.zshrc && npx hyperframes render --output final.mp4',
    '  201   200 04:59 sh -c hyperframes render --output final.mp4',
    '  202   201 04:59 node /Users/x/.npm/_npx/abc/node_modules/.bin/hyperframes render --output final.mp4',
    '  203   202 01:10 /opt/homebrew/bin/ffmpeg -y -f image2pipe -i - final.mp4',
  ].join('\n'))
  expect(nested.map(j => [j.pid, j.kind, j.seconds])).toEqual([[200, 'hyperframes', 300]])
  expect(fmt(3723)).toBe('1:02:03')
  expect(average([10, 20])).toBe(15)
  // 평균 대비 진행률: 기록 없으면 undefined, 평균 넘어도 99 에서 멈춤
  expect(percent(30, 120)).toBe(25)
  expect(percent(500, 120)).toBe(99)
  expect(percent(30, undefined)).toBeUndefined()
})

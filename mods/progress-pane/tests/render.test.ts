import { expect, test } from 'claude-code/testing'
import { average, fmt, parseEtime, parsePs, percent } from '../hooks/render'

test('ps 출력에서 렌더 프로세스만 추리고 경과 시간을 초로 변환', async () => {
  const out = [
    '  101 01:02:03 /opt/homebrew/bin/ffmpeg -i a.mp4 b.mp4',
    '  102 1-00:00:05 npx hyperframes render --out x.mp4',
    '  103 00:10 /usr/libexec/logd',
  ].join('\n')
  const jobs = parsePs(out)
  expect(jobs.map(j => j.kind)).toEqual(['ffmpeg', 'hyperframes'])
  expect(jobs[0]?.seconds).toBe(3723)
  expect(parseEtime('1-00:00:05')).toBe(86405)
  expect(fmt(3723)).toBe('1:02:03')
  expect(average([10, 20])).toBe(15)
  // 평균 대비 진행률: 기록 없으면 undefined, 평균 넘어도 99 에서 멈춤
  expect(percent(30, 120)).toBe(25)
  expect(percent(500, 120)).toBe(99)
  expect(percent(30, undefined)).toBeUndefined()
})

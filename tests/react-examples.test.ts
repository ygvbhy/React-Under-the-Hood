// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fixtureCases } from './fixtures/react-examples/cases'
import { collectReactExampleCases } from './helpers/react-example-cases'
import { runReactExample } from './helpers/run-react-example'

const conceptCases = (await collectReactExampleCases()).filter(
  (c) => !fixtureCases.some((f) => f.name === c.name),
)

// L1: React 예제를 jsdom에서 실제로 실행해 expectedOutput과 대조한다(브라우저 교차 검증은 e2e 스펙).
describe('React 예제 실행기', () => {
  it.each(fixtureCases.filter((c) => !c.errors))('$name', async (c) => {
    const cases = await collectReactExampleCases()
    const target = cases.find((x) => x.name === c.name)!
    const { output, errors } = await runReactExample(target.absPath, target.interactions)
    expect(output).toEqual(c.expectedOutput)
    expect(errors).toEqual([])
  })

  it('렌더 함수 안의 console.log("50%")는 위반으로 기록한다', async () => {
    const target = (await collectReactExampleCases()).find((x) => x.name === 'percent-in-render')!
    const { errors } = await runReactExample(target.absPath, target.interactions)
    expect(errors.some((e) => e.includes('"%"는 쓸 수 없습니다'))).toBe(true)
  })

  // vi.resetModules()는 react·react-dom(외부 모듈)을 다시 로드하지 않고 예제 모듈만 다시 실행한다.
  // 그래서 이 테스트는 "예제 모듈이 재실행된다"만 확인하며, React 상태 격리를 보장하지는 않는다.
  it('같은 예제를 연속 두 번 실행해도 출력이 같다', async () => {
    const target = (await collectReactExampleCases()).find((x) => x.name === 'click-batching')!
    const first = await runReactExample(target.absPath, target.interactions)
    const second = await runReactExample(target.absPath, target.interactions)
    expect(second.output).toEqual(first.output)
  })
})

// 개념이 0개면 describe가 비어 Vitest가 실패하므로, 있을 때만 등록한다.
if (conceptCases.length > 0) {
  describe('개념 예제', () => {
    it.each(conceptCases)('$name', async (c) => {
      const { output, errors } = await runReactExample(c.absPath, c.interactions)
      expect(output).toEqual(c.expectedOutput)
      expect(errors).toEqual([])
    })
  })
}

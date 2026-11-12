import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { assertScenarioInvariants } from '../../../tests/helpers/scenario-invariants'
import { concept } from './meta'
import { scenarios } from './scenarios'

const examplesDir = join(import.meta.dirname, 'examples')
const readExample = (file: string) => readFileSync(join(examplesDir, file), 'utf8')

function exampleOf(id: string) {
  const example = concept.examples.find((e) => e.id === id)
  if (!example) throw new Error(`예제 없음: ${id}`)
  return example
}

const stepsOf = (id: string) => scenarios.find((s) => s.id === id)!.steps

// 같은 위치의 호출을 position별로 [1번째, 2번째] returns로 모은다.
function pairsOf(id: string): string[][] {
  const last = stepsOf(id).at(-1)!
  const pairs: string[][] = []
  for (const c of last.state.calls) {
    ;(pairs[c.position - 1] ??= [])[c.call - 1] = c.returns
  }
  return pairs
}

describe('시나리오 불변식', () => {
  for (const scenario of scenarios) {
    it(`"${scenario.id}"는 공통 불변식을 만족한다`, () => {
      const example = exampleOf(scenario.exampleId)
      assertScenarioInvariants(scenario, example, readExample(example.file))
    })
  }
})

describe('시나리오 구성', () => {
  it('id·exampleId·단계 수', () => {
    expect(scenarios.map((s) => [s.id, s.exampleId, s.steps.length])).toEqual([
      ['impure-strict', 'impure-ticket-strict', 10],
      ['pure-strict', 'pure-ticket-strict', 10],
    ])
  })

  it('첫 단계는 line이 없고 output이 비어 있다', () => {
    for (const scenario of scenarios) {
      expect(scenario.steps[0].line).toBeUndefined()
      expect(scenario.steps[0].output).toEqual([])
    }
  })

  it('calls는 단계마다 이전 단계에 하나씩만 늘거나 그대로이다', () => {
    for (const scenario of scenarios) {
      scenario.steps.forEach((step, i) => {
        if (i === 0) return
        const diff = step.state.calls.length - scenario.steps[i - 1].state.calls.length
        expect([0, 1], `${scenario.id} 단계 ${i + 1}`).toContain(diff)
      })
    }
  })

  it('screen은 마지막(커밋) 단계 전까지 null이고 커밋 단계에는 line이 없다', () => {
    for (const scenario of scenarios) {
      const lastIndex = scenario.steps.length - 1
      scenario.steps.forEach((step, i) => {
        expect(step.state.screen === null, `${scenario.id} 단계 ${i + 1}`).toBe(i < lastIndex)
      })
      expect(scenario.steps[lastIndex].line).toBeUndefined()
    }
  })
})

describe('상태와 출력의 정합', () => {
  it('impure-strict: 호출 단계마다 outer.value가 1씩 늘고 같은 위치의 두 호출 결과가 다르다', () => {
    const steps = stepsOf('impure-strict')
    for (let i = 3; i <= 8; i++) {
      expect(steps[i].state.outer!.value, `단계 ${i + 1}`).toBe(
        steps[i - 1].state.outer!.value! + 1,
      )
    }
    expect(steps[3].state.outer!.value).toBe(2)
    expect(steps[8].state.outer!.value).toBe(7)
    const pairs = pairsOf('impure-strict')
    expect(pairs).toHaveLength(3)
    for (const [a, b] of pairs) expect(a).not.toBe(b)
  })

  it('pure-strict: outer가 null이고 같은 위치의 두 호출 결과가 같다', () => {
    for (const step of stepsOf('pure-strict')) expect(step.state.outer).toBeNull()
    const pairs = pairsOf('pure-strict')
    expect(pairs).toHaveLength(3)
    for (const [a, b] of pairs) expect(a).toBe(b)
  })

  it('커밋 screen은 각 위치의 2번째 호출 returns의 글이며 출력의 화면 줄과 같다', () => {
    for (const scenario of scenarios) {
      const last = scenario.steps.at(-1)!
      const secondCalls = last.state.calls.filter((c) => c.call === 2)
      const texts = secondCalls.map((c) => c.returns.replace(/^<li>(.*)<\/li>$/, '$1'))
      expect(last.state.screen, scenario.id).toEqual(texts)
      expect(last.output!.at(-1), scenario.id).toBe(`화면: ${JSON.stringify(last.state.screen)}`)
    }
  })
})

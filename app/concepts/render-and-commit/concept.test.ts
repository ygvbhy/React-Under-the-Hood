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
      ['state-update', 'state-update', 10],
      ['same-result', 'same-result', 11],
    ])
  })

  it('첫 단계는 line이 없고 output이 비어 있다', () => {
    for (const scenario of scenarios) {
      expect(scenario.steps[0].line).toBeUndefined()
      expect(scenario.steps[0].output).toEqual([])
    }
  })

  it('트리거 단계는 호출한 컴포넌트가 없다', () => {
    for (const scenario of scenarios) {
      scenario.steps.forEach((step, i) => {
        if (step.state.phase === 'trigger') {
          expect(step.state.rendered, `${scenario.id} 단계 ${i + 1}`).toEqual([])
        }
      })
    }
  })

  it('changed: true인 줄은 커밋 단계에만 있다', () => {
    for (const scenario of scenarios) {
      scenario.steps.forEach((step, i) => {
        const anyChanged = (step.state.dom ?? []).some((d) => d.changed)
        if (anyChanged) expect(step.state.phase, `${scenario.id} 단계 ${i + 1}`).toBe('commit')
      })
    }
  })

  it('커밋 단계에는 line이 없다', () => {
    for (const scenario of scenarios) {
      for (const step of scenario.steps) {
        if (step.state.phase === 'commit') expect(step.line).toBeUndefined()
      }
    }
  })

  it('dom은 첫 커밋 전까지 null이고 그 뒤로는 null이 아니다', () => {
    for (const scenario of scenarios) {
      const firstCommit = scenario.steps.findIndex((s) => s.state.phase === 'commit')
      scenario.steps.forEach((step, i) => {
        expect(step.state.dom === null, `${scenario.id} 단계 ${i + 1}`).toBe(i < firstCommit)
      })
    }
  })
})

describe('상태와 출력의 정합', () => {
  it('state-update: 단계 9는 Counter만 호출하고 화면의 output은 아직 0이다', () => {
    const step = stepsOf('state-update')[8]
    expect(step.state.phase).toBe('render')
    expect(step.state.rendered.map((c) => c.name)).toEqual(['Counter'])
    expect(step.state.dom!.find((d) => d.label.startsWith('<output>'))!.label).toBe('<output> 0')
    expect(step.output!.at(-1)).toBe('Counter 렌더: count 1, 화면 0')
  })

  it('state-update: 첫 커밋은 네 줄이 모두 바뀌고, 두 번째 커밋은 output 줄만 바뀐다', () => {
    const steps = stepsOf('state-update')
    expect(steps[6].state.dom!.map((d) => d.changed)).toEqual([true, true, true, true])
    const changed = steps[9].state.dom!.filter((d) => d.changed)
    expect(changed.map((d) => d.label)).toEqual(['<output> 1'])
    expect(steps[9].output!.at(-1)).toBe('DOM 변경: ["output"]')
  })

  it('same-result: 마지막 단계는 바뀐 줄이 없고 출력이 앞 단계와 같다', () => {
    const steps = stepsOf('same-result')
    const last = steps[steps.length - 1]
    const prev = steps[steps.length - 2]
    expect(last.state.phase).toBe('commit')
    expect(last.state.dom!.some((d) => d.changed)).toBe(false)
    expect(last.output).toEqual(prev.output)
  })

  it('same-result: 두 번째 렌더가 돌려준 JSX 요약(p의 글)은 첫 번째 클릭 뒤와 같다', () => {
    const steps = stepsOf('same-result')
    expect(steps[9].state.rendered).toEqual(steps[6].state.rendered)
  })
})

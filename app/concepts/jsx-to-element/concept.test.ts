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
      ['element-object', 'element-object', 7],
      ['element-tree', 'element-tree', 7],
    ])
  })

  it('첫 단계는 line이 없고 output이 비어 있다', () => {
    for (const scenario of scenarios) {
      expect(scenario.steps[0].line).toBeUndefined()
      expect(scenario.steps[0].output).toEqual([])
    }
  })

  it('element-object: calls와 root는 마지막 단계에서만 비어 있지 않다', () => {
    const steps = scenarios.find((s) => s.id === 'element-object')!.steps
    steps.forEach((step, i) => {
      const isLast = i === steps.length - 1
      expect(step.state.calls.length > 0, `단계 ${i + 1} calls`).toBe(isLast)
      expect(step.state.root !== null, `단계 ${i + 1} root`).toBe(isLast)
    })
  })

  it('element-tree: 컴포넌트가 없으므로 calls는 항상 비어 있다', () => {
    const steps = scenarios.find((s) => s.id === 'element-tree')!.steps
    for (const step of steps) expect(step.state.calls).toEqual([])
  })
})

describe('상태와 출력의 정합', () => {
  it('element-object: fromJsx·fromCall의 props는 name "민지" 하나뿐이고 출력의 props JSON과 같다', () => {
    const steps = scenarios.find((s) => s.id === 'element-object')!.steps
    const last = steps[steps.length - 1]
    const expectedJson = JSON.stringify({ name: '민지' })
    const jsonLines = (last.output ?? []).filter((l) => l.startsWith('{'))
    expect(jsonLines).toEqual([expectedJson, expectedJson])
    for (const name of ['fromJsx', 'fromCall']) {
      const variable = last.state.variables.find((v) => v.name === name)!
      expect(variable.value.props).toEqual([{ name: 'name', value: '"민지"' }])
      const asObject = Object.fromEntries(
        variable.value.props.map((p) => [p.name, JSON.parse(p.value as string)]),
      )
      expect(JSON.stringify(asObject)).toBe(expectedJson)
    }
  })

  it('element-tree: 상태의 children이 출력과 맞는다', () => {
    const last = scenarios.find((s) => s.id === 'element-tree')!.steps.at(-1)!
    const card = last.state.variables[0].value
    expect(card.type).toBe('"section"')
    const children = card.props.find((p) => p.name === 'children')!.value
    expect(Array.isArray(children)).toBe(true)
    expect((children as unknown[]).length).toBe(2)
    expect(last.output).toContain('true 2')
  })
})

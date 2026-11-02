import { describe, expect, it } from 'vitest'
import { groupByCategory } from './concept-groups'
import type { ConceptCategory, ConceptMeta } from './concepts'

function fake(slug: string, category: ConceptCategory): ConceptMeta {
  return {
    slug,
    title: slug,
    summary: '',
    category,
    order: 10,
    tags: [],
    goals: [],
    prerequisites: [],
    jsPrerequisites: [],
    related: [],
    examples: [],
    simplifications: [],
    references: [],
    reviewedAt: null,
  }
}

describe('groupByCategory', () => {
  it('카테고리 선언 순서대로 묶고 빈 카테고리를 숨긴다', () => {
    const groups = groupByCategory([
      fake('m', 'optimization'),
      fake('f1', 'rendering'),
      fake('f2', 'rendering'),
      fake('a', 'state'),
    ])
    expect(groups.map((g) => g.category)).toEqual(['rendering', 'state', 'optimization'])
    expect(groups[0].label).toBe('렌더링 기초')
    expect(groups[0].concepts.map((c) => c.slug)).toEqual(['f1', 'f2'])
  })

  it('개념이 없으면 빈 배열이다', () => {
    expect(groupByCategory([])).toEqual([])
  })
})

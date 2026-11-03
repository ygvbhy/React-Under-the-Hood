import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdjacentConcepts, type ConceptMeta } from '~/lib/concepts'
import { ConceptPager } from './ConceptPager'

vi.mock('~/lib/concepts', () => ({ getAdjacentConcepts: vi.fn() }))

function stub(slug: string, title: string): ConceptMeta {
  return {
    slug,
    title,
    summary: '요약',
    category: 'rendering',
    order: 10,
    tags: [],
    goals: ['목표'],
    prerequisites: [],
    jsPrerequisites: [],
    related: [],
    examples: [],
    simplifications: ['단순화'],
    references: [{ label: '참고', url: 'https://example.com' }],
    reviewedAt: null,
  }
}

const a = stub('concept-a', '개념 A')
const b = stub('concept-b', '개념 B')
const c = stub('concept-c', '개념 C')

function renderPager(adjacent: ReturnType<typeof getAdjacentConcepts>) {
  vi.mocked(getAdjacentConcepts).mockReturnValue(adjacent)
  render(
    <MemoryRouter>
      <ConceptPager slug="any" />
    </MemoryRouter>,
  )
  return screen.getByRole('navigation', { name: '학습 순서' })
}

describe('ConceptPager', () => {
  beforeEach(() => {
    vi.mocked(getAdjacentConcepts).mockReset()
  })

  it('첫 개념은 이전 없이 다음 링크만 있다', () => {
    const nav = renderPager({ prev: null, next: b, position: 1, total: 3 })
    expect(within(nav).getByText('학습 순서 1 / 3')).toBeInTheDocument()
    expect(within(nav).queryByText('이전 개념')).not.toBeInTheDocument()
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/concepts/concept-b')
    expect(links[0]).toHaveTextContent('다음 개념')
  })

  it('마지막 개념은 다음 없이 이전 링크만 있다', () => {
    const nav = renderPager({ prev: b, next: null, position: 3, total: 3 })
    expect(within(nav).getByText('학습 순서 3 / 3')).toBeInTheDocument()
    expect(within(nav).queryByText('다음 개념')).not.toBeInTheDocument()
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/concepts/concept-b')
    expect(links[0]).toHaveTextContent('이전 개념')
  })

  it('중간 개념은 이전·다음 링크가 모두 있다', () => {
    const nav = renderPager({ prev: a, next: c, position: 2, total: 3 })
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((l) => l.getAttribute('href'))
    expect(hrefs).toEqual(['/concepts/concept-a', '/concepts/concept-c'])
  })

  it('유일한 개념은 링크가 없다', () => {
    const nav = renderPager({ prev: null, next: null, position: 1, total: 1 })
    expect(within(nav).getByText('학습 순서 1 / 1')).toBeInTheDocument()
    expect(within(nav).queryAllByRole('link')).toHaveLength(0)
  })
})

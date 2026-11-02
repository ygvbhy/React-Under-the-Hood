import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { jsConceptUrl } from '~/lib/js-site'
import { PrerequisiteList } from './PrerequisiteList'

describe('PrerequisiteList', () => {
  it('slug가 있으면 링크, 없으면 준비 중 텍스트 칩이다', () => {
    render(
      <MemoryRouter>
        <PrerequisiteList
          prerequisites={[{ label: '실행 컨텍스트', slug: 'execution-context' }, { label: '변수' }]}
          jsPrerequisites={[]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 2, name: '선행 개념' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '실행 컨텍스트' })).toHaveAttribute(
      'href',
      '/concepts/execution-context',
    )
    expect(screen.queryByRole('link', { name: /변수/ })).not.toBeInTheDocument()
    expect(screen.getByText('변수')).toBeInTheDocument()
    expect(screen.getByText('(준비 중)')).toHaveClass('sr-only')
  })

  it('비어 있으면 섹션을 숨긴다', () => {
    const { container } = render(
      <MemoryRouter>
        <PrerequisiteList prerequisites={[]} jsPrerequisites={[]} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('JS 사이트 선행 개념은 새 창 외부 링크 칩이다', () => {
    render(
      <MemoryRouter>
        <PrerequisiteList
          prerequisites={[]}
          jsPrerequisites={[
            { label: '클로저', slug: 'closure', anchor: '호출마다-새-환경' },
            { label: '함수 호출', slug: 'function-calls' },
          ]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 2, name: '선행 개념' })).toBeInTheDocument()
    const withAnchor = screen.getByRole('link', { name: /클로저/ })
    expect(withAnchor).toHaveAttribute('href', jsConceptUrl('closure', '호출마다-새-환경'))
    expect(withAnchor).toHaveAttribute('target', '_blank')
    expect(withAnchor).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: /함수 호출/ })).toHaveAttribute(
      'href',
      jsConceptUrl('function-calls'),
    )
    expect(screen.getAllByText('(JS Under the Hood, 새 창)')[0]).toHaveClass('sr-only')
  })
})

import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ElementObjectView } from './ElementObjectView'
import { scenarios } from './scenarios'

function stepOf(id: string, index: number) {
  return scenarios.find((s) => s.id === id)!.steps[index].state
}

describe('ElementObjectView', () => {
  it('실행 전에는 빈 상태 문구를 보여 준다', () => {
    render(<ElementObjectView state={stepOf('element-object', 0)} />)
    expect(screen.getByText('아직 만든 element가 없습니다.')).toBeInTheDocument()
    expect(screen.getByText('아직 호출되지 않음')).toBeInTheDocument()
    expect(screen.getByText('비어 있음')).toBeInTheDocument()
  })

  it('중첩 children은 카드 안에 h2 카드와 문자열로 그린다', () => {
    render(<ElementObjectView state={stepOf('element-tree', 1)} />)
    const vars = within(screen.getByRole('region', { name: '변수' }))
    expect(vars.getByText('태그 이름 "section"')).toBeInTheDocument()
    const section = document.querySelector<HTMLElement>('[data-element-type="\\"section\\""]')!
    const h2 = within(section).getByText('태그 이름 "h2"')
    expect(h2).toBeInTheDocument()
    expect(within(section).getByText('"본문"')).toBeInTheDocument()
    expect(within(section).getByText('"제목"')).toBeInTheDocument()
    expect(within(section).getAllByText('children', { selector: 'span' })).toHaveLength(2)
  })

  it('컴포넌트 element는 함수 이름으로, key가 없으면 null로 보여 준다', () => {
    render(<ElementObjectView state={stepOf('element-object', 1)} />)
    expect(screen.getByText('컴포넌트 함수 Greeting')).toBeInTheDocument()
    expect(screen.getByText('null')).toBeInTheDocument()
    expect(screen.getByText('"민지"')).toBeInTheDocument()
  })

  it('호출 기록과 #root를 보여 준다', () => {
    const last = scenarios[0].steps[scenarios[0].steps.length - 1].state
    render(<ElementObjectView state={last} />)
    const calls = within(screen.getByRole('region', { name: '컴포넌트 호출 기록' }))
    expect(calls.getByText('Greeting({ name: "민지" })')).toBeInTheDocument()
    const root = within(screen.getByRole('region', { name: '#root' }))
    expect(root.getByText('<h1> 안녕, 민지')).toBeInTheDocument()
    expect(screen.queryByText('아직 호출되지 않음')).not.toBeInTheDocument()
  })
})

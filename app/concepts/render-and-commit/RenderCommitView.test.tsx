import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RenderCommitView } from './RenderCommitView'
import { scenarios } from './scenarios'

function stepOf(id: string, index: number) {
  return scenarios.find((s) => s.id === id)!.steps[index].state
}

describe('RenderCommitView', () => {
  it('실행 전에는 빈 상태 문구를 보여 주고 현재 단계가 없다', () => {
    render(<RenderCommitView state={stepOf('state-update', 0)} />)
    expect(
      within(screen.getByRole('region', { name: '트리거' })).getByText('없음'),
    ).toBeInTheDocument()
    expect(screen.getByText('이번 렌더에서 호출한 컴포넌트 없음')).toBeInTheDocument()
    expect(screen.getByText('비어 있음')).toBeInTheDocument()
    expect(screen.getByText('대기 중')).toBeInTheDocument()
    expect(screen.queryByText('현재')).not.toBeInTheDocument()
  })

  it('렌더 단계에서는 렌더가 현재 단계로 표시되고 호출 목록이 순서대로 나온다', () => {
    render(<RenderCommitView state={stepOf('state-update', 4)} />)
    const phase = within(screen.getByRole('region', { name: '단계 표시' }))
    expect(phase.getAllByText('현재')).toHaveLength(1)
    const current = document.querySelector('[data-current="true"]')!
    expect(current).toHaveAttribute('data-phase', 'render')
    expect(current).toHaveTextContent('렌더')
    expect(screen.queryByText('대기 중')).not.toBeInTheDocument()
    const list = within(screen.getByRole('region', { name: '이번 렌더에서 호출한 컴포넌트' }))
    expect(list.getAllByRole('listitem').map((li) => li.getAttribute('data-component'))).toEqual([
      'App',
      'Title',
    ])
    expect(screen.getByText('비어 있음')).toBeInTheDocument()
  })

  it('트리거 단계에서는 트리거 문구를 보여 준다', () => {
    render(<RenderCommitView state={stepOf('state-update', 7)} />)
    const trigger = within(screen.getByRole('region', { name: '트리거' }))
    expect(trigger.getByText('setCount(count + 1) → count 1')).toBeInTheDocument()
    expect(screen.getByText('이번 렌더에서 호출한 컴포넌트 없음')).toBeInTheDocument()
  })

  it('state-update 첫 커밋에서는 4줄이, 두 번째 커밋에서는 1줄이 "바뀜"이다', () => {
    const { unmount } = render(<RenderCommitView state={stepOf('state-update', 6)} />)
    expect(screen.getAllByText('바뀜')).toHaveLength(4)
    expect(document.querySelectorAll('[data-changed="true"]')).toHaveLength(4)
    expect(document.querySelector('[data-current="true"]')).toHaveAttribute('data-phase', 'commit')
    unmount()
    render(<RenderCommitView state={stepOf('state-update', 9)} />)
    expect(screen.getAllByText('바뀜')).toHaveLength(1)
    const changed = document.querySelector<HTMLElement>('[data-changed="true"]')!
    expect(changed).toHaveTextContent('<output> 1')
  })

  it('렌더 중에는 DOM이 이전 값 그대로이고 "바뀜"이 없다', () => {
    render(<RenderCommitView state={stepOf('state-update', 8)} />)
    const dom = within(screen.getByRole('region', { name: '#root의 DOM' }))
    expect(dom.getByText('<output> 0')).toBeInTheDocument()
    expect(screen.queryByText('바뀜')).not.toBeInTheDocument()
  })

  it('DOM 변경 없는 다시 렌더의 마지막 커밋에는 "바뀜"이 없다', () => {
    const steps = scenarios.find((s) => s.id === 'same-result')!.steps
    render(<RenderCommitView state={steps[steps.length - 1].state} />)
    expect(screen.queryByText('바뀜')).not.toBeInTheDocument()
    expect(screen.getByText('<p> 눌렀어요')).toBeInTheDocument()
  })
})

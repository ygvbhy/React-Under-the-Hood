import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PurityView } from './PurityView'
import { scenarios } from './scenarios'

function stepOf(id: string, index: number) {
  return scenarios.find((s) => s.id === id)!.steps[index].state
}

describe('PurityView', () => {
  it('impure 실행 전: 바깥 변수는 선언 전, 호출 없음, 화면 비어 있음', () => {
    render(<PurityView state={stepOf('impure-strict', 0)} />)
    expect(screen.getByText('아직 선언 전')).toBeInTheDocument()
    expect(screen.getByText('아직 호출한 컴포넌트 없음')).toBeInTheDocument()
    expect(screen.getByText('비어 있음')).toBeInTheDocument()
    expect(screen.queryByText('이 예제는 바깥 변수를 쓰지 않습니다')).not.toBeInTheDocument()
  })

  it('pure 실행 전: 바깥 변수를 쓰지 않는다는 문구를 보여 준다', () => {
    render(<PurityView state={stepOf('pure-strict', 0)} />)
    expect(
      within(screen.getByRole('region', { name: '바깥 변수' })).getByText(
        '이 예제는 바깥 변수를 쓰지 않습니다',
      ),
    ).toBeInTheDocument()
  })

  it('impure ⑤: 1번째 Ticket의 두 호출이 있고 "두 결과 다름" 1개', () => {
    render(<PurityView state={stepOf('impure-strict', 4)} />)
    expect(screen.getAllByText('두 결과 다름')).toHaveLength(1)
    expect(screen.queryByText('두 결과 같음')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-same="false"]')).toHaveLength(1)
    expect(screen.getByText('nextNumber = 3')).toBeInTheDocument()
  })

  it('impure ⑨: "두 결과 다름" 3개', () => {
    render(<PurityView state={stepOf('impure-strict', 8)} />)
    expect(screen.getAllByText('두 결과 다름')).toHaveLength(3)
    expect(screen.getByText('nextNumber = 7')).toBeInTheDocument()
  })

  it('한 번만 호출된 위치에는 배지가 없다', () => {
    render(<PurityView state={stepOf('impure-strict', 3)} />)
    expect(screen.queryByText(/두 결과/)).not.toBeInTheDocument()
  })

  it('pure ⑨: "두 결과 같음" 3개', () => {
    render(<PurityView state={stepOf('pure-strict', 8)} />)
    expect(screen.getAllByText('두 결과 같음')).toHaveLength(3)
    expect(document.querySelectorAll('[data-same="true"]')).toHaveLength(3)
    expect(screen.queryByText('두 결과 다름')).not.toBeInTheDocument()
  })

  it('impure ⑩: 화면 목록은 번호표 2·4·6', () => {
    render(<PurityView state={stepOf('impure-strict', 9)} />)
    const area = within(screen.getByRole('region', { name: '화면 (#root의 li)' }))
    expect(area.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '번호표 2',
      '번호표 4',
      '번호표 6',
    ])
    expect(screen.queryByText('비어 있음')).not.toBeInTheDocument()
  })

  it('pure ⑩: 화면 목록은 번호표 1·2·3', () => {
    render(<PurityView state={stepOf('pure-strict', 9)} />)
    const area = within(screen.getByRole('region', { name: '화면 (#root의 li)' }))
    expect(area.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '번호표 1',
      '번호표 2',
      '번호표 3',
    ])
  })
})

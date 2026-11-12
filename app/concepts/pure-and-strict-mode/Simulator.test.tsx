import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { concept } from './meta'
import { Simulator } from './Simulator'
import { scenarios } from './scenarios'

const REGION_NAME = 'StrictMode 두 번 호출 시뮬레이터'

async function next(user: ReturnType<typeof userEvent.setup>, times: number) {
  for (let i = 0; i < times; i++) {
    await user.click(screen.getByRole('button', { name: '다음' }))
  }
}

describe('Simulator', () => {
  it('처음에는 첫 시나리오의 1단계(실행 전)를 보여 준다', () => {
    render(<Simulator scenarios={scenarios} />)
    expect(screen.getByRole('region', { name: REGION_NAME })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: scenarios[0].label })).toBeChecked()
    expect(screen.getByText('단계 1: 실행 전')).toBeInTheDocument()
    expect(screen.getByText('아직 선언 전')).toBeInTheDocument()
    expect(screen.getByText('아직 호출한 컴포넌트 없음')).toBeInTheDocument()
    expect(screen.getByText('비어 있음')).toBeInTheDocument()
  })

  it('시나리오를 바꾸면 1단계로 돌아간다', async () => {
    const user = userEvent.setup()
    render(<Simulator scenarios={scenarios} />)
    await next(user, 3)
    await user.click(screen.getByRole('radio', { name: scenarios[1].label }))
    expect(screen.getByText('단계 1: 실행 전')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: scenarios[1].label })).toBeChecked()
    expect(screen.getByText('이 예제는 바깥 변수를 쓰지 않습니다')).toBeInTheDocument()
    expect(screen.getByText('비어 있음')).toBeInTheDocument()
  })

  it('각 시나리오의 마지막 단계에서 콘솔 출력이 meta의 expectedOutput과 같다', async () => {
    const user = userEvent.setup()
    render(<Simulator scenarios={scenarios} />)
    for (const [i, scenario] of scenarios.entries()) {
      if (i > 0) await user.click(screen.getByRole('radio', { name: scenario.label }))
      const last = scenario.steps.length
      await next(user, last - 1)
      expect(screen.getByText(`단계 ${last} / ${last}`)).toBeInTheDocument()
      const consoleRegion = screen.getByRole('region', { name: '콘솔 출력' })
      const expected = concept.examples.find((e) => e.id === scenario.exampleId)!.expectedOutput
      const lines = within(consoleRegion)
        .getAllByRole('listitem')
        .map((li) => li.textContent)
      expect(lines).toEqual(expected)
    }
  })

  it('영역에 포커스를 두고 →/←/Home으로 단계를 옮긴다', async () => {
    const user = userEvent.setup()
    render(<Simulator scenarios={scenarios} />)
    screen.getByRole('region', { name: REGION_NAME }).focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByText(`단계 3: ${scenarios[0].steps[2].title}`)).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByText(`단계 2: ${scenarios[0].steps[1].title}`)).toBeInTheDocument()
    await user.keyboard('{ArrowRight}{Home}')
    expect(screen.getByText('단계 1: 실행 전')).toBeInTheDocument()
  })
})

import { SimulatorShell } from '~/simulator'
import type { Scenario } from '~/simulator'
import { ElementObjectView } from './ElementObjectView'
import type { ElementSimState } from './scenarios'

type Props = {
  scenarios: Scenario<ElementSimState>[]
}

// 개념 전용 래퍼: 공통 셸에 영역 라벨과 element 시각화만 넘긴다.
export function Simulator({ scenarios }: Props) {
  return (
    <SimulatorShell
      scenarios={scenarios}
      label="JSX element 시뮬레이터"
      renderState={(state) => <ElementObjectView state={state} />}
    />
  )
}

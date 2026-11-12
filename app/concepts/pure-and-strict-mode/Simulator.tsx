import { SimulatorShell } from '~/simulator'
import type { Scenario } from '~/simulator'
import { PurityView } from './PurityView'
import type { PurityState } from './scenarios'

type Props = {
  scenarios: Scenario<PurityState>[]
}

// 개념 전용 래퍼: 공통 셸에 영역 라벨과 두 번 호출 시각화만 넘긴다.
export function Simulator({ scenarios }: Props) {
  return (
    <SimulatorShell
      scenarios={scenarios}
      label="StrictMode 두 번 호출 시뮬레이터"
      renderState={(state) => <PurityView state={state} />}
    />
  )
}

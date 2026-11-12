import { SimulatorShell } from '~/simulator'
import type { Scenario } from '~/simulator'
import { RenderCommitView } from './RenderCommitView'
import type { RenderCommitState } from './scenarios'

type Props = {
  scenarios: Scenario<RenderCommitState>[]
}

// 개념 전용 래퍼: 공통 셸에 영역 라벨과 렌더·커밋 시각화만 넘긴다.
export function Simulator({ scenarios }: Props) {
  return (
    <SimulatorShell
      scenarios={scenarios}
      label="렌더와 커밋 시뮬레이터"
      renderState={(state) => <RenderCommitView state={state} />}
    />
  )
}

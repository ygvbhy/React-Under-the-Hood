export type FixtureCase = {
  name: string
  file: string // 이 폴더 안의 .jsx 파일명
  interactions: { type: 'click'; selector: string }[]
  expectedOutput: string[]
  // 'expect-violation': 실행기가 errors에 위반을 기록해야 하는 케이스(Chromium 교차 검증 대상 아님)
  errors?: 'expect-violation'
}

// expectedOutput은 Chromium(개발 빌드 React)에서 실제로 실행해 얻은 값이다.
export const fixtureCases: FixtureCase[] = [
  {
    name: 'strict-mode',
    file: 'strict-mode.jsx',
    interactions: [],
    expectedOutput: ['after render call', 'render', 'render', 'effect', 'cleanup', 'effect'],
  },
  {
    name: 'click-batching',
    file: 'click-batching.jsx',
    interactions: [{ type: 'click', selector: 'button' }],
    expectedOutput: ['render 0', 'clicked 0', 'render 1'],
  },
  {
    name: 'microtask-order',
    file: 'microtask-order.jsx',
    interactions: [{ type: 'click', selector: 'button' }],
    expectedOutput: [
      'render 0',
      'layout 0',
      'effect 0',
      'handler end',
      'microtask',
      'render 1',
      'layout 1',
      'effect 1',
      'timeout',
    ],
  },
  {
    name: 'effect-set-state',
    file: 'effect-set-state.jsx',
    interactions: [],
    expectedOutput: ['sync end', 'render false', 'effect false', 'render true', 'effect true'],
  },
  {
    name: 'percent-in-render',
    file: 'percent-in-render.jsx',
    interactions: [],
    expectedOutput: ['50%'],
    errors: 'expect-violation',
  },
]

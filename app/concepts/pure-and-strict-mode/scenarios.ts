import type { Scenario } from '~/simulator'
import impureCode from './examples/impure-ticket-strict.jsx?raw'
import pureCode from './examples/pure-ticket-strict.jsx?raw'

// 상태 모델 규칙(교육용 그림이며 React 내부 자료구조가 아니다)
// - 각 Step의 state는 그 시점의 전체 스냅샷이다(이전 단계와의 차분이 아니다).
// - outer: 컴포넌트 바깥에 선언한 변수. null이면 이 예제는 바깥 변수를 쓰지 않는다.
//   value가 null이면 아직 선언 전이다.
// - calls: 이번 렌더에서 지금까지 호출된 Ticket을 호출된 순서대로 담는다.
//   position은 몇 번째 Ticket인지(1~3), call은 그 Ticket의 몇 번째 호출인지(1 또는 2),
//   returns는 그 호출이 돌려준 JSX의 요약이다.
// - screen: 커밋 뒤 #root 안 li의 글. null이면 아직 비어 있다. 커밋은 한 단계로 묶었다.
// - 같은 위치의 두 호출 결과가 "같음/다름"인지는 시각화(PurityView)에서만 비교한다. React가 비교하는 것이 아니다.
export type TicketCall = { position: number; call: 1 | 2; returns: string }

export type PurityState = {
  outer: { name: string; value: number | null } | null
  calls: TicketCall[]
  screen: string[] | null
}

const li = (n: number) => `<li>번호표 ${n}</li>`

// 숫자 뒤 조사. 숫자를 한국어로 읽었을 때 받침이 있는지로 고른다(0 영·1 일·3 삼·6 육·7 칠·8 팔).
// 받침이 ㄹ(1·7·8)이면 '으로'가 아니라 '로'를 쓴다.
const hasFinal = (n: number) => [0, 1, 3, 6, 7, 8].includes(n % 10)
const withEul = (n: number) => `${n}${hasFinal(n) ? '을' : '를'}`
const withI = (n: number) => `${n}${hasFinal(n) ? '이' : '가'}`
const withIraseo = (n: number) => `${n}${hasFinal(n) ? '이라서' : '라서'}`
const withRo = (n: number) => `${n}${[0, 3, 6].includes(n % 10) ? '으로' : '로'}`
const log = (n: number) => `Ticket 렌더: 번호표 ${n}`

const OBSERVE_EXPLANATION =
  'DOM이 바뀌면 화면의 번호표를 찍는 관찰용 코드입니다. React 기능이 아니라 화면에 실제로 무엇이 보이는지 확인하려는 장치입니다.'

// ---- impure-strict: 렌더 중 바깥 변수를 바꾸는 Ticket ----
// 호출 k(0~5)의 번호는 k + 1이고, 호출 뒤 nextNumber는 k + 2이다.
const impureOrder: { position: number; call: 1 | 2 }[] = [
  { position: 1, call: 1 },
  { position: 1, call: 2 },
  { position: 2, call: 1 },
  { position: 2, call: 2 },
  { position: 3, call: 1 },
  { position: 3, call: 2 },
]
const ordinal = (n: number) => `${n}번째`

const impureCalls = (count: number): TicketCall[] =>
  impureOrder.slice(0, count).map((o, k) => ({ ...o, returns: li(k + 1) }))
const impureLog = (count: number): string[] => Array.from({ length: count }, (_, k) => log(k + 1))
const impureOuter = (value: number | null) => ({ name: 'nextNumber', value })

const impureCallStep = (count: number) => {
  const { position, call } = impureOrder[count - 1]
  const number = count
  return {
    title: `${ordinal(position)} Ticket ${call}번째 호출`,
    explanation:
      call === 1
        ? `${ordinal(position)} Ticket을 호출합니다. 바깥 변수 nextNumber의 값 ${withEul(number)} 읽어 번호로 쓰고 ${withRo(number + 1)} 늘립니다. 돌려준 JSX는 번호표 ${number}입니다.`
        : `StrictMode라서 같은 ${ordinal(position)} Ticket을 이어서 한 번 더 호출합니다. 이번에는 nextNumber가 ${withIraseo(number)} 번호표 ${withEul(number)} 돌려주고, 변수는 ${withI(number + 1)} 됩니다. 같은 컴포넌트인데 결과가 달라졌습니다.`,
    line: { from: 7, to: 12 },
    state: {
      outer: impureOuter(number + 1),
      calls: impureCalls(count),
      screen: null,
    } satisfies PurityState,
    output: impureLog(count),
  }
}

const impureFinal = ['번호표 2', '번호표 4', '번호표 6']
const impureScreenLine = '화면: ["번호표 2","번호표 4","번호표 6"]'

// ---- pure-strict: props만 쓰는 Ticket ----
const pureOrder = impureOrder
const pureCalls = (count: number): TicketCall[] =>
  pureOrder.slice(0, count).map((o) => ({ ...o, returns: li(o.position) }))
const pureLog = (count: number): string[] => pureOrder.slice(0, count).map((o) => log(o.position))

const pureCallStep = (count: number) => {
  const { position, call } = pureOrder[count - 1]
  return {
    title: `${position}번째 Ticket ${call}번째 호출`,
    explanation:
      call === 1
        ? `${position}번째 Ticket을 호출합니다. props로 받은 number(${position})만 쓰므로 번호표 ${withEul(position)} 돌려줍니다.`
        : `같은 ${position}번째 Ticket을 한 번 더 호출합니다. props가 같고 바깥 변수를 쓰지 않으므로 이번에도 번호표 ${withEul(position)} 돌려줍니다. 두 호출 결과가 같습니다.`,
    line: { from: 6, to: 9 },
    state: {
      outer: null,
      calls: pureCalls(count),
      screen: null,
    } satisfies PurityState,
    output: pureLog(count),
  }
}

export const scenarios: Scenario<PurityState>[] = [
  {
    id: 'impure-strict',
    label: '바깥 변수를 바꾸는 Ticket',
    exampleId: 'impure-ticket-strict',
    code: impureCode,
    steps: [
      {
        title: '실행 전',
        explanation:
          '아직 아무것도 실행하지 않았습니다. 이 예제의 Ticket은 렌더 중에 바깥 변수를 읽고 바꿉니다.',
        state: { outer: impureOuter(null), calls: [], screen: null },
        output: [],
      },
      {
        title: '바깥 변수와 관찰 코드 준비',
        explanation: `모듈 바깥에 nextNumber를 1로 선언합니다. ${OBSERVE_EXPLANATION}`,
        line: { from: 4, to: 18 },
        state: { outer: impureOuter(1), calls: [], screen: null },
        output: [],
      },
      {
        title: 'root.render 호출',
        explanation:
          'root.render는 StrictMode로 감싼 트리를 그려 달라는 요청입니다. 이 줄에서 Ticket이 바로 호출되는 것은 아닙니다. 컴포넌트 호출은 이 요청 뒤에 일어납니다.',
        line: { from: 20, to: 28 },
        state: { outer: impureOuter(1), calls: [], screen: null },
        output: [],
      },
      impureCallStep(1),
      impureCallStep(2),
      impureCallStep(3),
      impureCallStep(4),
      impureCallStep(5),
      impureCallStep(6),
      {
        title: '커밋: 화면에 반영',
        explanation: `이 예제에서는 화면의 번호표가 각 Ticket의 두 번째 호출 결과와 같았습니다. 번호표 1, 2, 3이 아니라 2, 4, 6이 보입니다. 관찰용 코드가 화면을 찍습니다.`,
        state: { outer: impureOuter(7), calls: impureCalls(6), screen: impureFinal },
        output: [...impureLog(6), impureScreenLine],
      },
    ],
  },
  {
    id: 'pure-strict',
    label: 'props만 쓰는 Ticket',
    exampleId: 'pure-ticket-strict',
    code: pureCode,
    steps: [
      {
        title: '실행 전',
        explanation:
          '아직 아무것도 실행하지 않았습니다. 이 예제의 Ticket은 props로 받은 number만 쓰고 바깥 변수를 쓰지 않습니다.',
        state: { outer: null, calls: [], screen: null },
        output: [],
      },
      {
        title: '관찰 코드 준비',
        explanation: OBSERVE_EXPLANATION,
        line: { from: 4, to: 15 },
        state: { outer: null, calls: [], screen: null },
        output: [],
      },
      {
        title: 'root.render 호출',
        explanation:
          'root.render는 StrictMode로 감싼 트리를 그려 달라는 요청입니다. 이 줄에서 Ticket이 바로 호출되는 것은 아닙니다. 컴포넌트 호출은 이 요청 뒤에 일어납니다.',
        line: { from: 17, to: 25 },
        state: { outer: null, calls: [], screen: null },
        output: [],
      },
      pureCallStep(1),
      pureCallStep(2),
      pureCallStep(3),
      pureCallStep(4),
      pureCallStep(5),
      pureCallStep(6),
      {
        title: '커밋: 화면에 반영',
        explanation:
          '두 번씩 호출했지만 같은 위치의 결과가 같아서 어느 결과가 쓰여도 화면은 번호표 1, 2, 3입니다.',
        state: {
          outer: null,
          calls: pureCalls(6),
          screen: ['번호표 1', '번호표 2', '번호표 3'],
        },
        output: [...pureLog(6), '화면: ["번호표 1","번호표 2","번호표 3"]'],
      },
    ],
  },
]

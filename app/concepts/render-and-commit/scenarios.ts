import type { Scenario } from '~/simulator'
import sameResultCode from './examples/same-result.jsx?raw'
import stateUpdateCode from './examples/state-update.jsx?raw'

// 상태 모델 규칙(교육용 그림이며 React 내부 자료구조가 아니다)
// - 각 Step의 state는 그 시점의 전체 스냅샷이다(이전 단계와의 차분이 아니다).
// - phase: 지금 어느 단계인지. 'idle'은 아직 트리거가 없는 상태, 나머지는 트리거·렌더·커밋이다.
//   커밋은 한 단계로 묶었다.
// - trigger: 이번 렌더를 일으킨 것을 코드 표기 그대로의 문자열로 담는다. 트리거가 없으면 null이다.
// - rendered: 이번 렌더(트리거 이후)에서 React가 호출한 컴포넌트를 호출된 순서대로 담는다.
//   returns는 그 컴포넌트가 돌려준 JSX의 요약이다. 트리거 단계에서는 비어 있다.
// - dom: #root 안의 DOM을 들여쓴 줄 목록으로 요약한 것(태그 이름과 텍스트만). null이면 #root가 비어 있다.
//   changed는 방금 커밋에서 바뀐 줄이다. 렌더 중에는 DOM이 바뀌지 않으므로 항상 false이다.
export type Phase = 'idle' | 'trigger' | 'render' | 'commit'

export type RenderedCall = { name: string; returns: string }

export type DomLine = { depth: number; label: string; changed: boolean }

export type RenderCommitState = {
  phase: Phase
  trigger: string | null
  rendered: RenderedCall[]
  dom: DomLine[] | null
}

const line = (depth: number, label: string, changed = false): DomLine => ({
  depth,
  label,
  changed,
})

// ---- state-update ----
const appCall: RenderedCall = { name: 'App', returns: '<main><Title /><Counter /></main>' }
const titleCall: RenderedCall = { name: 'Title', returns: '<h1>카운터</h1>' }
const counterCall0: RenderedCall = {
  name: 'Counter',
  returns: '<output>0</output> <button>+1</button>',
}
const counterCall1: RenderedCall = {
  name: 'Counter',
  returns: '<output>1</output> <button>+1</button>',
}

const firstTrigger = 'root.render(<App />)'
const clickTrigger = 'setCount(count + 1) → count 1'

const counterDom0 = (changed: boolean): DomLine[] => [
  line(0, '<main>', changed),
  line(1, '<h1> 카운터', changed),
  line(1, '<output> 0', changed),
  line(1, '<button> +1', changed),
]
const counterDom1: DomLine[] = [
  line(0, '<main>'),
  line(1, '<h1> 카운터'),
  line(1, '<output> 1', true),
  line(1, '<button> +1'),
]

const outApp = ['App 렌더']
const outTitle = [...outApp, 'Title 렌더']
const outCounter0 = [...outTitle, 'Counter 렌더: count 0, 화면 없음']
const outCommit0 = [...outCounter0, 'DOM 변경: ["#root"]']
const outCounter1 = [...outCommit0, 'Counter 렌더: count 1, 화면 0']
const outCommit1 = [...outCounter1, 'DOM 변경: ["output"]']

const stateUpdateScenario: Scenario<RenderCommitState> = {
  id: 'state-update',
  label: 'state 업데이트',
  exampleId: 'state-update',
  code: stateUpdateCode,
  steps: [
    {
      title: '실행 전',
      explanation: '아직 아무 줄도 실행하지 않았습니다. 트리거도 없고 #root는 비어 있습니다.',
      state: { phase: 'idle', trigger: null, rendered: [], dom: null },
      output: [],
    },
    {
      title: '관찰 코드 등록',
      explanation:
        'MutationObserver가 #root 안의 DOM 변경을 지켜보기 시작합니다. 관찰용 코드이고 React 기능은 아닙니다. 아직 아무것도 바뀌지 않았습니다.',
      line: { from: 33, to: 40 },
      state: { phase: 'idle', trigger: null, rendered: [], dom: null },
      output: [],
    },
    {
      title: '트리거: 첫 렌더 요청',
      explanation:
        'root.render(<App />)가 첫 렌더를 요청합니다. 트리거는 요청일 뿐이며, 이 단계에서는 컴포넌트가 아직 호출되지 않았습니다.',
      line: { from: 42, to: 42 },
      state: { phase: 'trigger', trigger: firstTrigger, rendered: [], dom: null },
      output: [],
    },
    {
      title: '렌더: App 호출',
      explanation:
        '렌더는 React가 컴포넌트 함수를 호출하는 일입니다. 첫 렌더는 루트 컴포넌트 App부터 시작하고, App이 돌려준 JSX에 컴포넌트가 있으면 이어서 렌더합니다.',
      line: { from: 23, to: 31 },
      state: { phase: 'render', trigger: firstTrigger, rendered: [appCall], dom: null },
      output: outApp,
    },
    {
      title: '렌더: Title 호출',
      explanation: 'App이 돌려준 JSX 안의 Title을 호출합니다. #root는 아직 비어 있습니다.',
      line: { from: 6, to: 9 },
      state: { phase: 'render', trigger: firstTrigger, rendered: [appCall, titleCall], dom: null },
      output: outTitle,
    },
    {
      title: '렌더: Counter 호출',
      explanation:
        'Counter를 호출합니다. 이 시점에 화면에서 output을 찾아도 없어서 "화면 없음"이 찍힙니다. 렌더하는 동안에는 화면의 DOM이 바뀌지 않습니다.',
      line: { from: 11, to: 21 },
      state: {
        phase: 'render',
        trigger: firstTrigger,
        rendered: [appCall, titleCall, counterCall0],
        dom: null,
      },
      output: outCounter0,
    },
    {
      title: '커밋: #root에 붙음',
      explanation:
        '커밋에서 렌더 결과의 DOM 노드가 #root에 붙어 화면에 나타납니다. 관찰 코드는 바뀐 요소로 #root를 찍습니다.',
      state: {
        phase: 'commit',
        trigger: firstTrigger,
        rendered: [appCall, titleCall, counterCall0],
        dom: counterDom0(true),
      },
      output: outCommit0,
    },
    {
      title: '트리거: 버튼 클릭',
      explanation:
        '클릭하면 setCount(count + 1)이 호출되어 count를 1로 바꾸라는 state 업데이트가 트리거됩니다. 컴포넌트는 아직 호출되지 않았고 DOM도 그대로입니다.',
      line: { from: 18, to: 18 },
      state: {
        phase: 'trigger',
        trigger: clickTrigger,
        rendered: [],
        dom: counterDom0(false),
      },
      output: outCommit0,
    },
    {
      title: '렌더: Counter만 호출',
      explanation:
        '다시 렌더할 때는 그 state를 가진 컴포넌트 Counter를 호출합니다. App과 Title은 Counter가 돌려준 JSX 안에 있지 않으므로 호출되지 않고, Counter는 자식 컴포넌트가 없어서 이어서 호출할 컴포넌트도 없습니다. 렌더 중 화면의 output은 아직 이전 값 0입니다.',
      line: { from: 11, to: 21 },
      state: {
        phase: 'render',
        trigger: clickTrigger,
        rendered: [counterCall1],
        dom: counterDom0(false),
      },
      output: outCounter1,
    },
    {
      title: '커밋: output만 바뀜',
      explanation:
        '커밋에서는 이전 렌더와 달라진 곳만 DOM에 반영합니다. 바뀐 것은 output의 텍스트뿐이고 h1과 button은 그대로입니다.',
      state: {
        phase: 'commit',
        trigger: clickTrigger,
        rendered: [counterCall1],
        dom: counterDom1,
      },
      output: outCommit1,
    },
  ],
}

// ---- same-result ----
const mainLine = line(0, '<main>')
const buttonLine = line(1, '<button> 누르기')
const statusCall0: RenderedCall = {
  name: 'Status',
  returns: '<main><p>아직 안 눌렀어요</p> <button>누르기</button></main>',
}
const statusCall1: RenderedCall = {
  name: 'Status',
  returns: '<main><p>눌렀어요</p> <button>누르기</button></main>',
}
const statusCall2: RenderedCall = { ...statusCall1 }

const firstStatusTrigger = 'root.render(<Status />)'
const click1 = 'setClicks(clicks + 1) → clicks 1'
const click2 = 'setClicks(clicks + 1) → clicks 2'

const statusDom0 = (changed: boolean): DomLine[] => [
  line(0, '<main>', changed),
  line(1, '<p> 아직 안 눌렀어요', changed),
  line(1, '<button> 누르기', changed),
]
const statusDom1 = (changed: boolean): DomLine[] => [
  mainLine,
  line(1, '<p> 눌렀어요', changed),
  buttonLine,
]

const sOut0 = ['Status 렌더: clicks 0']
const sCommit0 = [...sOut0, 'DOM 변경: ["#root"]']
const sOut1 = [...sCommit0, 'Status 렌더: clicks 1']
const sCommit1 = [...sOut1, 'DOM 변경: ["p"]']
const sOut2 = [...sCommit1, 'Status 렌더: clicks 2']

const sameResultScenario: Scenario<RenderCommitState> = {
  id: 'same-result',
  label: 'DOM 변경 없는 다시 렌더',
  exampleId: 'same-result',
  code: sameResultCode,
  steps: [
    {
      title: '실행 전',
      explanation: '아직 아무 줄도 실행하지 않았습니다. 트리거도 없고 #root는 비어 있습니다.',
      state: { phase: 'idle', trigger: null, rendered: [], dom: null },
      output: [],
    },
    {
      title: '관찰 코드 등록',
      explanation:
        'MutationObserver가 #root 안의 DOM 변경을 지켜보기 시작합니다. 관찰용 코드이고 React 기능은 아닙니다. 아직 아무것도 바뀌지 않았습니다.',
      line: { from: 17, to: 24 },
      state: { phase: 'idle', trigger: null, rendered: [], dom: null },
      output: [],
    },
    {
      title: '트리거: 첫 렌더 요청',
      explanation:
        'root.render(<Status />)가 첫 렌더를 요청합니다. 이 단계에서는 Status가 아직 호출되지 않았습니다.',
      line: { from: 26, to: 26 },
      state: { phase: 'trigger', trigger: firstStatusTrigger, rendered: [], dom: null },
      output: [],
    },
    {
      title: '렌더: Status 호출 (clicks 0)',
      explanation:
        'React가 루트 컴포넌트 Status를 호출합니다. clicks가 0이라서 "아직 안 눌렀어요"가 들어간 JSX를 돌려줍니다. #root는 아직 비어 있습니다.',
      line: { from: 6, to: 15 },
      state: { phase: 'render', trigger: firstStatusTrigger, rendered: [statusCall0], dom: null },
      output: sOut0,
    },
    {
      title: '커밋: #root에 붙음',
      explanation: '커밋에서 렌더 결과의 DOM 노드가 #root에 붙어 화면에 나타납니다.',
      state: {
        phase: 'commit',
        trigger: firstStatusTrigger,
        rendered: [statusCall0],
        dom: statusDom0(true),
      },
      output: sCommit0,
    },
    {
      title: '트리거: 첫 번째 클릭',
      explanation:
        '클릭하면 setClicks(clicks + 1)이 호출되어 clicks를 1로 바꾸라는 state 업데이트가 트리거됩니다. DOM은 아직 그대로입니다.',
      line: { from: 12, to: 12 },
      state: { phase: 'trigger', trigger: click1, rendered: [], dom: statusDom0(false) },
      output: sCommit0,
    },
    {
      title: '렌더: Status 호출 (clicks 1)',
      explanation:
        '그 state를 가진 컴포넌트 Status를 다시 호출합니다. 이번에는 "눌렀어요"가 들어간 JSX를 돌려줍니다. 렌더 중 화면의 DOM은 아직 이전 그대로입니다.',
      line: { from: 6, to: 15 },
      state: { phase: 'render', trigger: click1, rendered: [statusCall1], dom: statusDom0(false) },
      output: sOut1,
    },
    {
      title: '커밋: p만 바뀜',
      explanation:
        '이번 렌더 결과가 이전 렌더 결과와 달라진 곳은 p의 텍스트뿐이므로, 커밋에서 p만 바뀝니다. 관찰 코드가 p를 찍습니다.',
      state: { phase: 'commit', trigger: click1, rendered: [statusCall1], dom: statusDom1(true) },
      output: sCommit1,
    },
    {
      title: '트리거: 두 번째 클릭',
      explanation:
        '한 번 더 클릭하면 setClicks(clicks + 1)로 clicks를 2로 바꾸라는 state 업데이트가 트리거됩니다. DOM은 아직 그대로입니다.',
      line: { from: 12, to: 12 },
      state: { phase: 'trigger', trigger: click2, rendered: [], dom: statusDom1(false) },
      output: sCommit1,
    },
    {
      title: '렌더: Status 호출 (clicks 2)',
      explanation:
        'Status를 다시 호출합니다. clicks는 2가 되었지만 돌려준 JSX에서 p의 글은 앞 렌더와 같은 "눌렀어요"입니다.',
      line: { from: 6, to: 15 },
      state: { phase: 'render', trigger: click2, rendered: [statusCall2], dom: statusDom1(false) },
      output: sOut2,
    },
    {
      title: '커밋: 바뀐 DOM 없음',
      explanation:
        '이전 렌더와 비교해 DOM에 반영할 차이가 없어서 바꿀 DOM이 없습니다. 다시 렌더했지만 관찰 코드는 아무것도 찍지 않아 출력이 늘지 않습니다.',
      state: { phase: 'commit', trigger: click2, rendered: [statusCall2], dom: statusDom1(false) },
      output: sOut2,
    },
  ],
}

export const scenarios: Scenario<RenderCommitState>[] = [stateUpdateScenario, sameResultScenario]

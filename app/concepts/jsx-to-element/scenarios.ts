import type { Scenario } from '~/simulator'
import elementObjectCode from './examples/element-object.jsx?raw'
import elementTreeCode from './examples/element-tree.jsx?raw'

// 상태 모델 규칙(교육용 그림이며 React 내부 자료구조가 아니다)
// - 각 Step의 state는 그 시점의 전체 스냅샷이다(이전 단계와의 차분이 아니다).
// - variables: 그 시점까지 만들어진 element 변수. 선언 순서대로 쌓인다.
// - ElementView.props: element.props의 열거 가능한 키를 순서대로 담는다. children도 props의 한 행이다.
//   값은 코드 표기 그대로의 문자열('"민지"')이거나, 중첩 element, 또는 그 배열(자식 여러 개)이다.
// - ElementView.type: 태그면 따옴표를 포함한 문자열('"section"'), 컴포넌트면 함수 이름('Greeting')이다.
// - calls: React가 컴포넌트 함수를 호출한 기록. element를 만드는 것만으로는 쌓이지 않는다.
// - root: render 뒤 #root에 나타난 결과의 요약(태그 이름과 텍스트만).
export type ElementView = {
  type: string
  key: string | null
  props: { name: string; value: string | ElementView | (ElementView | string)[] }[]
}

export type ElementSimState = {
  variables: { name: string; value: ElementView }[]
  calls: string[]
  root: string | null
}

const greetingProps = [{ name: 'name', value: '"민지"' }]
const greetingElement: ElementView = { type: 'Greeting', key: null, props: greetingProps }
const vars2 = [
  { name: 'fromJsx', value: greetingElement },
  { name: 'fromCall', value: greetingElement },
]
const vars1 = vars2.slice(0, 1)

const empty: ElementSimState = { variables: [], calls: [], root: null }

const objectScenario: Scenario<ElementSimState> = {
  id: 'element-object',
  label: 'JSX와 createElement',
  exampleId: 'element-object',
  code: elementObjectCode,
  steps: [
    {
      title: '실행 전',
      explanation: '아직 아무 줄도 실행하지 않았습니다. 만든 element도, 컴포넌트 호출도 없습니다.',
      state: empty,
      output: [],
    },
    {
      title: 'JSX로 element 만들기',
      explanation:
        '9줄의 JSX 태그가 평가되면 type이 Greeting이고 props가 name 하나인 객체가 fromJsx에 들어갑니다. Greeting 함수는 아직 호출되지 않았습니다.',
      line: { from: 9, to: 9 },
      state: { variables: vars1, calls: [], root: null },
      output: [],
    },
    {
      title: 'createElement로 element 만들기',
      explanation:
        '10줄의 createElement(Greeting, { name: "민지" })도 같은 모양의 객체를 돌려줍니다. 여기서도 Greeting은 호출되지 않습니다.',
      line: { from: 10, to: 10 },
      state: { variables: vars2, calls: [], root: null },
      output: [],
    },
    {
      title: 'element의 type 확인',
      explanation:
        'fromJsx는 객체이고, fromJsx.type은 Greeting 함수와 같습니다. 태그 이름이 아니라 함수 자체가 type에 들어 있습니다.',
      line: { from: 12, to: 12 },
      state: { variables: vars2, calls: [], root: null },
      output: ['object true'],
    },
    {
      title: '두 element의 props 비교',
      explanation: '두 element의 props를 JSON으로 찍으면 둘 다 {"name":"민지"}입니다.',
      line: { from: 13, to: 14 },
      state: { variables: vars2, calls: [], root: null },
      output: ['object true', '{"name":"민지"}', '{"name":"민지"}'],
    },
    {
      title: 'fromJsx === fromCall',
      explanation:
        '내용이 같아도 두 element는 서로 다른 객체이므로 === 비교는 false입니다. 이 비교는 JavaScript의 객체 동등 비교입니다.',
      line: { from: 15, to: 15 },
      state: { variables: vars2, calls: [], root: null },
      output: ['object true', '{"name":"민지"}', '{"name":"민지"}', 'false'],
    },
    {
      title: 'render: React가 Greeting을 호출',
      explanation:
        'render에 fromJsx를 넘기면 React가 그 element를 렌더하면서 Greeting을 한 번 호출합니다. 이 호출은 render 줄이 실행되는 그 자리에서 바로 일어나지 않으며, 시점은 "렌더링은 컴포넌트 함수를 호출하는 것"에서 다룹니다. 시뮬레이터는 그 과정을 한 단계로 묶어 보입니다. fromCall은 렌더하지 않았으므로 호출되지 않습니다.',
      line: { from: 17, to: 17 },
      state: {
        variables: vars2,
        calls: ['Greeting({ name: "민지" })'],
        root: '<h1> 안녕, 민지',
      },
      output: ['object true', '{"name":"민지"}', '{"name":"민지"}', 'false', 'Greeting 호출: 민지'],
    },
  ],
}

const h2Element: ElementView = {
  type: '"h2"',
  key: null,
  props: [{ name: 'children', value: '"제목"' }],
}
const cardElement: ElementView = {
  type: '"section"',
  key: null,
  props: [
    { name: 'className', value: '"card"' },
    { name: 'children', value: [h2Element, '"본문"'] },
  ],
}
const cardVars = [{ name: 'card', value: cardElement }]
const cardState: ElementSimState = { variables: cardVars, calls: [], root: null }

const treeScenario: Scenario<ElementSimState> = {
  id: 'element-tree',
  label: '중첩된 JSX',
  exampleId: 'element-tree',
  code: elementTreeCode,
  steps: [
    {
      title: '실행 전',
      explanation: '아직 아무 줄도 실행하지 않았습니다. 만든 element도 없습니다.',
      state: empty,
      output: [],
    },
    {
      title: '중첩된 JSX로 card 만들기',
      explanation:
        'section 태그 안의 h2 태그와 텍스트가 section element의 props.children 배열이 됩니다. 자식 태그 h2도 type과 props를 가진 element 객체이고, 텍스트는 문자열 그대로입니다.',
      line: { from: 3, to: 8 },
      state: cardState,
      output: [],
    },
    {
      title: 'type과 className 확인',
      explanation:
        '태그 이름은 문자열로 type에 들어가고, className 속성은 props.className이 됩니다.',
      line: { from: 10, to: 10 },
      state: cardState,
      output: ['section card'],
    },
    {
      title: 'children은 배열',
      explanation: 'children은 자식 두 개(h2 element와 문자열)를 담은 배열입니다.',
      line: { from: 11, to: 11 },
      state: cardState,
      output: ['section card', 'true 2'],
    },
    {
      title: '첫 자식은 h2 element',
      explanation:
        '첫 자식의 type은 "h2"이고, 그 props.children은 문자열 "제목"입니다. 자식 태그도 같은 모양의 객체입니다.',
      line: { from: 12, to: 12 },
      state: cardState,
      output: ['section card', 'true 2', 'h2 제목'],
    },
    {
      title: '둘째 자식은 문자열',
      explanation: '둘째 자식은 element가 아니라 문자열이라 typeof가 "string"입니다.',
      line: { from: 13, to: 13 },
      state: cardState,
      output: ['section card', 'true 2', 'h2 제목', 'string'],
    },
    {
      title: 'render: 화면에 나타남',
      explanation:
        'render에 card를 넘기면 React가 이를 렌더해 #root에 반영합니다. 이 예제에는 컴포넌트가 없으므로 호출 기록은 비어 있습니다.',
      line: { from: 15, to: 15 },
      state: { variables: cardVars, calls: [], root: '<section> 제목 본문' },
      output: ['section card', 'true 2', 'h2 제목', 'string'],
    },
  ],
}

export const scenarios: Scenario<ElementSimState>[] = [objectScenario, treeScenario]

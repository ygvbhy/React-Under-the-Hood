import type { ConceptMeta } from '~/lib/concepts'

export const concept = {
  slug: 'render-and-commit',
  title: '렌더링은 컴포넌트 함수를 호출하는 것: 트리거 → 렌더 → 커밋',
  summary:
    '화면이 바뀔 때 React는 트리거·렌더·커밋 세 단계를 거칩니다. 렌더는 컴포넌트 함수를 호출하는 일이고, DOM은 커밋에서 달라진 곳만 바뀝니다.',
  category: 'rendering',
  order: 20,
  tags: [
    '렌더링',
    '렌더',
    '리렌더링',
    '다시 렌더',
    '트리거',
    '커밋',
    'commit',
    'render',
    're-render',
    'createRoot',
    'root.render',
    'useState',
    'DOM 업데이트',
    '페인트',
  ],
  goals: [
    '화면 갱신의 세 단계(트리거·렌더·커밋)를 순서대로 말할 수 있다',
    '첫 렌더와 state 업데이트 때 React가 어떤 컴포넌트를 호출하는지 설명할 수 있다',
    '렌더와 DOM 변경을 구분하고, 다시 렌더해도 DOM이 바뀌지 않을 수 있음을 설명할 수 있다',
  ],
  prerequisites: [{ label: 'JSX는 함수 호출이다', slug: 'jsx-to-element' }],
  jsPrerequisites: [
    { label: '함수 호출', slug: 'function-calls' },
    {
      label: 'DOM 노드 종류(nodeType·nodeName)',
      slug: 'dom-tree-nodes',
      anchor: '노드-종류와-nodetype-nodename',
    },
  ],
  related: ['jsx-to-element'],
  examples: [
    {
      id: 'first-render',
      file: 'first-render.jsx',
      runtime: 'react-dom',
      expectedOutput: [
        'render 호출 직후, #root 자식 수: 0',
        'App 렌더, #root 자식 수: 0',
        'Title 렌더',
        'Count 렌더',
        'DOM 변경: ["#root"]',
      ],
    },
    {
      id: 'state-update',
      file: 'state-update.jsx',
      runtime: 'react-dom',
      interactions: [{ type: 'click', selector: 'button' }],
      expectedOutput: [
        'App 렌더',
        'Title 렌더',
        'Counter 렌더: count 0, 화면 없음',
        'DOM 변경: ["#root"]',
        'Counter 렌더: count 1, 화면 0',
        'DOM 변경: ["output"]',
      ],
    },
    {
      id: 'same-result',
      file: 'same-result.jsx',
      runtime: 'react-dom',
      interactions: [
        { type: 'click', selector: 'button' },
        { type: 'click', selector: 'button' },
      ],
      expectedOutput: [
        'Status 렌더: clicks 0',
        'DOM 변경: ["#root"]',
        'Status 렌더: clicks 1',
        'DOM 변경: ["p"]',
        'Status 렌더: clicks 2',
      ],
    },
  ],
  simplifications: [
    '예제는 StrictMode 없이 렌더합니다. StrictMode에서는 개발 빌드가 컴포넌트를 두 번 호출해 렌더 로그가 두 번 찍힙니다. 이유는 "순수 함수와 StrictMode" 개념에서 다룹니다.',
    '관찰 코드는 DOM이 바뀐 요소의 이름만 중복 없이 찍습니다. React가 어떤 DOM 연산을 몇 번 하는지는 react.dev가 정하지 않으며 이 페이지도 다루지 않습니다. MutationObserver 콜백은 DOM이 바뀐 시점이 아니라 그 뒤에 불립니다.',
    '렌더 중에 DOM을 읽는 코드는 관찰용입니다. 실제 컴포넌트는 렌더 중에 DOM을 읽거나 바꾸지 않습니다. 이유는 "순수 함수와 StrictMode" 개념에서 다룹니다.',
    'root.render 호출 뒤 정확히 언제 렌더가 시작되는지는 다루지 않습니다. react.dev가 보장하는 것은 호출 자체가 동기가 아니라는 것뿐이며, flushSync로 감싸면 첫 렌더를 동기로 실행할 수 있습니다. state 업데이트가 렌더를 일으키는 시점도 다루지 않습니다.',
    '같은 root에 render를 다시 호출하는 경우는 다루지 않습니다. 이때는 첫 렌더처럼 새로 만들지 않고, 전달한 JSX에 맞게 DOM을 필요한 만큼 갱신합니다(createRoot 문서).',
    '예제의 state 업데이트는 모두 값을 바꿉니다. 이전과 같은 값(Object.is로 같은 값)으로 set하면 React는 다시 렌더를 건너뜁니다. 건너뛰기 전에 컴포넌트를 한 번 호출할 수는 있습니다(useState 문서). 이 동작은 "객체·배열 state" 개념에서 다룹니다.',
    '예제 2의 Counter는 자식 컴포넌트가 없습니다. 다시 렌더되는 컴포넌트 안의 자식 컴포넌트도 렌더되는 동작은 "리렌더링은 언제 일어나나" 개념, 여러 setState를 한 번에 처리하는 동작은 "배칭과 함수형 업데이트" 개념, 커밋 뒤 effect 실행은 "useEffect 실행 시점과 cleanup" 개념에서 다룹니다.',
    '시뮬레이터의 단계 표시·호출 목록·DOM 줄 목록은 교육용 그림이며 React 내부 자료구조가 아닙니다. 커밋은 한 단계로 묶었고, DOM은 태그 이름과 텍스트만 요약합니다. 호출 목록은 이번 렌더에서 호출한 컴포넌트와 그 컴포넌트가 돌려준 JSX 요약만 보여 주며, 요약에서는 onClick 같은 이벤트 핸들러를 생략합니다. 실제로는 렌더마다 새 핸들러 함수가 만들어지므로 돌려준 JSX가 이전과 완전히 같지는 않습니다.',
    '브라우저 페인트는 react.dev 설명으로만 다루며 예제로 관찰하지 않습니다.',
  ],
  references: [
    {
      label: 'React 문서: 렌더링과 커밋 (Render and Commit)',
      url: 'https://react.dev/learn/render-and-commit',
    },
    {
      label: 'React 문서: createRoot의 root.render',
      url: 'https://react.dev/reference/react-dom/client/createRoot#root-render',
    },
    {
      label: 'React 문서: useState의 set 함수',
      url: 'https://react.dev/reference/react/useState#setstate',
    },
    {
      label: 'MDN: MutationObserver (관찰 코드)',
      url: 'https://developer.mozilla.org/ko/docs/Web/API/MutationObserver',
    },
  ],
  reviewedAt: '2026-11-12',
} satisfies ConceptMeta

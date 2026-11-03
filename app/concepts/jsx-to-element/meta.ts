import type { ConceptMeta } from '~/lib/concepts'

export const concept = {
  slug: 'jsx-to-element',
  title: 'JSX는 함수 호출이다: element는 그냥 객체',
  summary:
    'JSX 태그는 createElement 같은 함수 호출의 다른 표기이고, 결과는 type·props·key를 가진 평범한 객체입니다. element를 만들기만 해서는 컴포넌트가 실행되지 않습니다.',
  category: 'rendering',
  order: 10,
  tags: [
    'JSX',
    'element',
    'createElement',
    'props',
    'children',
    'key',
    'ref',
    'React element',
    '엘리먼트',
  ],
  goals: [
    'JSX가 같은 element를 만드는 함수 호출의 다른 표기임을 설명할 수 있다',
    'element 객체의 type·props·key에 JSX의 무엇이 들어가는지 말할 수 있다',
    'element를 만드는 것과 컴포넌트가 호출되는 것을 구분할 수 있다',
  ],
  prerequisites: [],
  jsPrerequisites: [
    { label: '함수 호출', slug: 'function-calls' },
    { label: '원시 값과 객체', slug: 'primitives-and-objects' },
  ],
  related: [],
  examples: [
    {
      id: 'element-object',
      file: 'element-object.jsx',
      runtime: 'react-dom',
      expectedOutput: [
        'object true',
        '{"name":"민지"}',
        '{"name":"민지"}',
        'false',
        'Greeting 호출: 민지',
      ],
    },
    {
      id: 'element-tree',
      file: 'element-tree.jsx',
      runtime: 'react-dom',
      expectedOutput: ['section card', 'true 2', 'h2 제목', 'string'],
    },
    {
      id: 'key-and-ref',
      file: 'key-and-ref.jsx',
      runtime: 'react-dom',
      expectedOutput: ['q', '["ref","placeholder"]', 'true'],
    },
  ],
  simplifications: [
    'element 객체에는 type·props·key 외에도 React가 식별·개발 도구용으로 쓰는 내부 필드($$typeof 등)가 있고, 개발 빌드와 프로덕션 빌드에서 그 구성이 다릅니다. 이 페이지는 공개 문서에 나온 type·props·key(와 props.ref)만 다룹니다. type에도 이 페이지에서 본 문자열·함수 외에 다른 값이 올 수 있습니다(19.3.1에서 Fragment는 심볼, memo·forwardRef가 돌려준 컴포넌트는 객체, 클래스 컴포넌트는 클래스).',
    '실제 빌드에서는 빌드 도구가 JSX를 createElement가 아니라 빌드 도구 설정이 정한 JSX 런타임 함수 호출로 바꿉니다. 만들어지는 element의 type·props·key는 같으며, 이 페이지는 공개 API인 createElement로 비교합니다.',
    "19.3.1 개발 빌드는 key를 쓴 element의 props에 경고용 비열거 key 접근자를 두므로, 예제 3처럼 key가 있으면 'key' in props가 true입니다. 이 페이지는 열거 가능한 키(Object.keys, JSON.stringify)로 key가 props로 전달되지 않음을 보입니다.",
    '예제는 StrictMode 없이 렌더합니다. StrictMode 안에서는 개발 빌드가 컴포넌트를 두 번 호출하므로 예제 1의 "Greeting 호출: 민지"가 두 번 찍힙니다. 이유는 "순수 함수와 StrictMode" 개념에서 다룹니다.',
    'render 호출 뒤 React가 컴포넌트를 호출하고 화면에 반영하는 과정(트리거·렌더·커밋)은 "렌더링은 컴포넌트 함수를 호출하는 것" 개념에서 다룹니다. 시뮬레이터는 이를 한 단계로 묶었습니다.',
    'key의 역할은 "리스트와 key", ref의 쓰임은 "ref" 개념에서 다룹니다. 이 페이지는 element 안에서의 위치만 보입니다.',
    '클래스 컴포넌트의 ref는 다루지 않습니다. 클래스에 넘긴 ref도 element의 props.ref에는 들어 있지만(19.3.1 실행 확인), React 19 글에 따르면 클래스 인스턴스의 this.props로는 전달되지 않습니다.',
    '시뮬레이터의 element 카드·호출 기록·#root 상자는 교육용 그림이며 React 내부 자료구조가 아닙니다. #root 상자는 렌더 결과를 태그 이름과 텍스트로만 요약합니다.',
  ],
  references: [
    {
      label: 'React 문서: createElement',
      url: 'https://react.dev/reference/react/createElement',
    },
    {
      label: 'React 문서: JSX로 마크업 작성하기',
      url: 'https://react.dev/learn/writing-markup-with-jsx',
    },
    {
      label: 'React 19 업그레이드 가이드: element.ref 사용 중단(deprecated)',
      url: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#deprecated-element-ref',
    },
    {
      label: 'React 19 업그레이드 가이드: 새 JSX 변환이 필수',
      url: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#new-jsx-transform-is-now-required',
    },
    {
      label: 'React 19 글: ref를 prop으로 받기',
      url: 'https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop',
    },
  ],
  reviewedAt: '2026-11-03',
} satisfies ConceptMeta

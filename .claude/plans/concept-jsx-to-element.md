# 개념 1: JSX는 함수 호출이다 (jsx-to-element) 구현 계획

- 상태: 완료
- 작성일: 2026-11-03
- 기준: `main` @ `b1c94a8`

## 0. 요약
- 목적: 로드맵 1번 개념 페이지 `/concepts/jsx-to-element`(예제 3개, 시뮬레이터 시나리오 2개)를 추가하고, 개념 0개 때문에 지웠던 개념 테스트를 이 개념 기준으로 다시 추가한다.
- 범위: 사이트 강조색 토큰(`app/app.css`) 변경, `app/concepts/jsx-to-element/` 신규, `tests/`·`app/**/*.test.tsx`의 개념 의존 테스트 재추가(초기 구축 후속 작업으로서 일회성 예외), AGENTS.md·content-guide·로드맵의 "개념 0개" 서술 갱신 / 공통 컴포넌트·`app/lib`·`app/simulator`·설정 소스는 바꾸지 않음
- 위험: 개발 빌드 element의 숨은 필드(props의 `key` getter, `element.ref` 경고) 때문에 출력이나 설명이 실제와 어긋날 수 있음 → 열거 가능한 키와 `JSON.stringify`만 출력하고 jsdom·Chromium 두 곳에서 실행 검증
- 복잡도: 높음 · Consensus: 수행 (첫 참고 구현, 공통 테스트 여러 파일 재추가, 문서·코드 충돌 있음). Architect·Critic 1회 검토, HIGH 1건(공통)·MEDIUM 8건 반영
- 미확정: 1건

## 1. 요구사항
- 요구사항
  - 로드맵 1번 "JSX는 함수 호출이다: element는 그냥 객체"(category `rendering`, order 10). slug `jsx-to-element`(사용자 확정, 2026-11-03).
  - 시뮬레이터 포함(사용자 확정).
  - ref: 실행 결과와 React 19 업그레이드 가이드를 근거로 `props.ref`를 설명한다. `react18` Callout에 18과의 차이를 쓰고, createElement 문서의 문장이 19.3.1 실행 결과와 다르다는 점을 한 줄로 밝힌다(사용자 확정).
  - 초기 구축 계획의 후속 작업: 삭제 목록의 개념 테스트를 이 개념 기준으로 다시 추가하고 `skipIf`를 제거한다(`.claude/plans/react-uth-initial-setup.md:293`).
  - `reviewedAt: null`. 구현·리뷰 후 사용자 검토(가이드 10단계)를 받는다.
- 유지해야 하는 기존 동작
  - 공통 컴포넌트, 시뮬레이터 셸, 라우트, SEO, 하이드레이션 규칙.
  - 남아 있는 테스트의 단언.
  - `tests/react-examples.test.ts`의 `if (conceptCases.length > 0)`. 예제가 없는 개념만 있을 때도 파일이 실패하지 않게 막는 가드라서 유지한다. `build-output`의 `skipIf`는 개념이 1개 이상이면 필요 없어 제거한다.
- 제외 범위: 2번 이후 개념, 공통 소스 변경, 새 의존성, `reviewedAt` 날짜 기록(사용자 검토 후), 커밋, 클래스 컴포넌트의 ref.

## 2. 사실과 추정
### 사실
- 새 개념은 `app/concepts/<slug>/` 폴더만 추가하면 라우트·홈·sitemap·공통 테스트가 자동으로 잡는다 — `docs/content-guide.md:1-30,162-168`. `routes.ts`는 `route.tsx`가 있는 폴더만 등록하고, 레지스트리와 `collectReactExampleCases`는 `meta.ts`만 있으면 잡는다 — `tests/helpers/react-example-cases.ts:26-34`.
- 개념 0개 때문에 지운 테스트 목록 — `.claude/plans/react-uth-initial-setup.md:265-276`. 원본은 `../JS-Under-the-Hood` @ `980716b`이며, JS 원본에서 시뮬레이터가 있는 개념은 모두 `Simulator.test.tsx`와 `*View.test.tsx`를 가졌다(예: `app/concepts/closure/`). AGENTS.md:90도 개념별 `Simulator.test.tsx`를 전제한다.
- `build-output.test.ts`
  - `skipIf`: `:58-59`, `:249-250`.
  - 지운 JS 개념 describe를 설명하던 고아 주석: `:85-93`, `:226-247`. `:85-88`에는 data-wide 직계 자식, `<!-- -->` 처리처럼 새 describe에서 다시 쓸 일반 설명이 있다. `:248`은 pager 설명이라 유지한다.
  - 학습 순서 pager 일반식 검사: `:250-267`.
- `ConceptPager`
  - `getAdjacentConcepts(slug)`를 직접 호출한다.
  - 개념 1개여도 `nav[aria-label="학습 순서"]`와 `학습 순서 1 / 1`을 그리고, 링크는 0개다 — `app/components/concept/ConceptPager.tsx:2-10`.
- 선행 개념
  - 개념이 1개면 slug 있는 `prerequisites`는 둘 수 없다. content-integrity가 존재 여부를 검사하고 자기 자신을 금지한다.
  - `jsPrerequisites` 칩은 `target=_blank` 외부 링크다 — `app/components/concept/PrerequisiteList.tsx:21-49`.
- 시뮬레이터 타입 — `app/simulator/types.ts:1-16`. 공통 불변식 — `tests/helpers/scenario-invariants.ts:5-61`. 셸 `data-wide` — `app/simulator/SimulatorShell.tsx:70`. `.concept-body` — `app/components/concept/ConceptLayout.tsx:58`.
- 예제 실행기 — `tests/helpers/run-react-example.ts:21-70`.
  - jsdom에서 act 없이 실행하고, `console.log` 인수를 `String`으로 바꿔 이어 붙인다.
  - console.error/warn이 나오면 실패한다.
  - Chromium 스펙도 개발 빌드를 쓴다(`tests/e2e/react-examples.spec.ts`의 `define`). Playwright webServer는 기존 `build/client`를 띄우므로 먼저 `npm run build`가 필요하다 — `playwright.config.ts:29-33`.
- Playwright에서도 `readdirSync` + `meta.ts` 동적 import가 동작한다 — `tests/helpers/react-example-cases.ts:15-34`. `app/concepts/.gitkeep`은 `isDirectory()`로 거른다(`:31`).
- 갱신할 문서 문장
  - "개념 0개" — `AGENTS.md:119`
  - "아직 개념 페이지가 없으므로" — `docs/content-guide.md:3`
  - 제거한 테스트 안내 — `docs/content-guide.md:168`
  - 로드맵 상태 "확정(개념 작성 전)" — `.claude/plans/concept-roadmap.md:3`
  - 로드맵 1번 행의 "후보"·"작성 시 확인" — `concept-roadmap.md:19`
- JS 사이트 인덱스에 `function-calls`, `primitives-and-objects`가 있다 — `app/lib/js-site-index.json`(syncedAt 2026-11-02).
- 실행 확인(2026-11-03, React 19.3.1, Node, 메인·Architect·Critic이 각자 확인)
  - 개발 빌드에서 `createElement`, `jsx`, `jsxDEV`의 결과는 모두 `type === Greeting`이고 props JSON은 `{"name":"A","children":"hi"}`, `key: null`이다. 셋 다 element와 props를 freeze한다.
  - element를 만들기만 해서는 컴포넌트 함수가 호출되지 않는다(호출 0회).
  - `JSON.stringify(props)`와 `Object.keys(props)`에는 `key`가 없다. 예: `<input key="q" ref={r} placeholder="검색">` → `["ref","placeholder"]`, `element.key === "q"`.
  - **개발 빌드는 props에 열거되지 않는 경고 getter `key`를 정의한다.** 그래서 `'key' in props`는 개발 빌드에서 `true`, 프로덕션에서 `false`이고, `props.key`를 읽으면 console.error가 난다.
  - `ref`는 `props.ref`에 들어가고 읽어도 경고가 없다. `element.ref`를 읽으면 개발 빌드는 console.error "Accessing element.ref was removed in React 19. ref is now a regular prop…"를 낸다. 값은 여전히 ref를 돌려준다.
  - element의 열거 가능한 키: 개발 빌드는 `$$typeof,type,key,props,_owner,_store`, 프로덕션은 `$$typeof,type,key,ref,props`이고, 프로덕션은 freeze하지 않는다. → element 전체를 `JSON.stringify`하면 빌드마다 결과가 다르다.
  - 이 저장소의 Vite(`transformWithOxc`, automatic runtime)는 JSX를 개발 모드에서 `react/jsx-dev-runtime`의 `jsxDEV(...)`, 프로덕션에서 `react/jsx-runtime`의 `jsx(...)` 호출로 바꾼다.
- react.dev 근거(메인·Critic 확인)
  - `https://react.dev/reference/react/createElement`
    - 소개: "an alternative to writing JSX".
    - Caveats: `<Something />` ≡ `createElement(Something)`, 개발 모드에서 element와 props를 얕게 freeze.
    - Returns: "treat every element as opaque after it's created, and only render it".
    - Deep Dive: "creating this object does not render the Greeting component".
    - Parameters와 Returns는 "ref와 key는 props에서 빠지고 `element.ref`/`element.key`로 제공된다"고 쓴다. ref 부분은 19.3.1 실행 결과와 다르다.
  - `https://react.dev/learn/writing-markup-with-jsx`: "under the hood it is transformed into plain JavaScript objects", "attributes written in JSX become keys of JavaScript objects".
  - `https://react.dev/blog/2024/04/25/react-19-upgrade-guide`
    - `#deprecated-element-ref`: "deprecating the element.ref in place of element.props.ref".
    - `#new-jsx-transform-is-now-required`.
    - 두 앵커 모두 있는 것을 확인했다. `$$typeof` 변경은 언급하지 않는다.
  - `https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop`: 19부터 ref를 prop으로 받는다. 클래스에 넘긴 ref는 props로 전달되지 않는다는 Note가 있다.

### 추정
- jsdom과 Chromium에서 예제 출력이 같을 것이다. 세 예제 모두 모듈 최상위의 동기 로그와 첫 렌더 1회로 이루어져 있기 때문이다 — 작업 순서 1에서 확인한다.

## 3. 구현 전략
- 근거 구성: 다음 세 가지를 react.dev 문장과 예제 실행 출력으로 보인다.
  - JSX는 함수 호출의 다른 표기다.
  - 그 결과는 `type`·`props`·`key`를 가진 객체다.
  - 만들기만 해서는 컴포넌트가 호출되지 않는다.
- 컴파일 대상: 본문은 "빌드 도구가 JSX를 함수 호출로 바꾼다(업그레이드 가이드 `#new-jsx-transform-is-now-required`), 이 페이지는 같은 element를 만드는 공개 API `createElement`로 비교한다"까지만 쓴다. 함수 이름(`jsx`/`jsxDEV`)은 본문에 쓰지 않는다. `simplifications`에 "실제 빌드 결과는 createElement가 아니라 빌드 도구가 정한 JSX 런타임 함수 호출이고, 만들어지는 element의 type·props·key는 같다"를 적는다.
- 학습 목적의 속성 읽기: createElement 문서의 권고("element는 만든 뒤 불투명하게 다루고 렌더만 한다")를 `<Callout type="note">`로 본문 앞쪽에 둔다. "여기서는 동작을 보려고 속성을 읽을 뿐"이라고 밝힌다.
- 예제 출력 규칙
  - `type`과 원시 값, `JSON.stringify(props)`, `JSON.stringify(Object.keys(props))`만 출력한다.
  - 금지: `element.ref`, `props.key`, `'key' in props`, element 전체 `JSON.stringify`.
  - `$$typeof`, `_owner` 같은 내부 필드는 다루지 않고 simplifications에 적는다.
- 예제 3개(줄 번호는 작성 후 확정한다)
  - `element-object.jsx`(시나리오 1)
    - `Greeting`은 호출되면 `console.log('Greeting 호출: ' + name)`을 하고 `<h1>안녕, {name}</h1>`을 반환한다.
    - `const fromJsx = <Greeting name="민지" />`, `const fromCall = createElement(Greeting, { name: '민지' })`.
    - 출력: `typeof fromJsx`와 `fromJsx.type === Greeting`, 두 props JSON, `fromJsx === fromCall`.
    - 마지막 줄: `createRoot(document.getElementById('root')).render(fromJsx)`.
    - 예상 출력(실행으로 확정): `object true`, `{"name":"민지"}` ×2, `false`, `Greeting 호출: 민지`.
  - `element-tree.jsx`(시나리오 2)
    - `const card = (<section className="card"><h2>제목</h2>본문</section>)`.
    - 출력: `card.type`과 `card.props.className`, `Array.isArray(card.props.children)`와 길이, 첫 자식의 `type`과 `props.children`, 둘째 자식의 `typeof`.
    - 마지막에 render.
  - `key-and-ref.jsx`(시뮬레이터 없음)
    - `const inputRef = { current: null }`. `createRef`는 react.dev에서 Legacy로 분류되고 `useRef`는 컴포넌트 안에서만 쓸 수 있어서, ref 객체의 모양(`{ current }`)만 쓴다.
    - `const field = <input key="q" ref={inputRef} placeholder="검색" />`.
    - 출력: `field.key`, `JSON.stringify(Object.keys(field.props))`, `field.props.ref === inputRef`.
    - 마지막에 `render(field)`.
- 시뮬레이터
  - 상태: `{ variables: { name: string; value: ElementView }[]; calls: string[]; root: string | null }`.
  - `ElementView = { type: string; key: string | null; props: { name: string; value: string | ElementView | (ElementView | string)[] }[] }`. `children`은 props의 한 행(`children`)으로 그려 실제 구조(`props.children`)와 맞춘다.
  - 시각화: 변수별 element 카드(type·key 행, props 표, children 행 안에 중첩 카드), "컴포넌트 호출 기록"(비면 "아직 호출되지 않음"), "#root" 상자(비면 "비어 있음"). 텍스트 라벨로 구분하고 색만으로 구분하지 않는다. 중첩은 들여쓰기 대신 테두리 카드로 그려 375px에서 넘치지 않게 한다.
  - 시나리오 1의 렌더 단계는 "React가 Greeting을 호출하고 결과가 #root에 나타난다" 한 단계로 묶는다. 트리거→렌더→커밋의 구분은 2번 개념의 몫이다(simplifications).
  - `label="JSX element 시뮬레이터"`.
- 테스트 재추가 원칙
  - J 원본의 단언 의도를 유지하면서 개념 1개에서 성립하게 쓴다.
  - 개념 수·순서에 대한 단언은 레지스트리, 또는 e2e에서 `meta.ts` 동적 import로 계산한다. 그래야 개념이 늘어도 고치지 않는다.
  - ConceptPager 컴포넌트 테스트는 `vi.mock('~/lib/concepts')`로 `getAdjacentConcepts`를 스텁해 첫·중간·마지막 표시를 검증한다(저장소에서 처음 쓰는 패턴, 이 파일에만 적용). `getAdjacentConcepts` 함수 자체는 `concepts.test.ts`에서 실제 레지스트리로 일반식 검사를 한다.
- 버린 대안
  - (a) 예제에서 `react/jsx-runtime`을 직접 import: react.dev가 문서화한 공개 API가 아니다.
  - (b) element 전체를 `JSON.stringify`: 개발·프로덕션 결과가 다르다.
  - (c) 개념 수 하드코딩(J 방식): 개념을 추가할 때마다 공통 테스트를 고쳐야 한다.
  - (d) `'key' in props`로 key 제외를 보이기: 개발 빌드에서 `true`라 반대 결과가 나온다.
  - (e) 첫 개념이라 `Simulator.test.tsx`를 생략: AGENTS.md:90의 회귀 확인 경로와 셸 키보드·live region 단위 검증이 사라진다.

## 4. 변경 파일
- 추가 `app/concepts/jsx-to-element/`
  - `meta.ts`, `content.mdx`, `route.tsx`(가이드 6절 템플릿 그대로)
  - `examples/element-object.jsx`, `examples/element-tree.jsx`, `examples/key-and-ref.jsx`
  - `scenarios.ts`, `ElementObjectView.tsx`, `ElementObjectView.test.tsx`, `Simulator.tsx`, `Simulator.test.tsx`, `concept.test.ts`
- 추가 `app/components/concept/ConceptPager.test.tsx`: 스텁으로 첫(이전 없음·다음 1개)·마지막(다음 없음)·중간(링크 2개)·유일(`1 / 1`, 링크 0개)
- 추가 `tests/e2e/concept.spec.ts`, `tests/e2e/no-js.spec.ts`
- 수정 `tests/content-integrity.test.ts`: '개념이 하나 이상 있다' 재추가(`'개념 폴더'` describe 첫 테스트)
- 수정 `app/lib/concepts.test.ts`
  - 'listConcepts / getConcept': J 원본 3건.
  - 'getAdjacentConcepts': 일반식 3건 + 없는 슬러그 1건. 일반식은 다음과 같다.
    - `sortByOrder(listConcepts())`의 모든 개념에 대해 prev·next가 정렬상 이웃과 같고 position = 인덱스+1, total = 개념 수.
    - 첫 개념은 prev가 null.
    - 마지막 개념은 next가 null.
- 수정 `tests/build/build-output.test.ts`
  - `skipIf` 2곳과 그 주석을 제거한다.
  - 고아 주석 `:85-93`, `:226-247`를 제거하되, `:85-88`의 일반 설명은 새 describe 위 주석으로 옮긴다.
  - '시뮬레이터 프리렌더 (jsx-to-element)' describe를 추가한다.
    - 단계 1 문구, 호출 기록 빈 상태 문구, `(아직 출력 없음)`.
    - region에 `data-wide`가 있고 `.concept-body`의 직계 자식이며 `<p>`로 감싸이지 않는다(J `primitives-and-objects` 방식).
    - 시나리오 라디오 2개와 그 라벨, `<details` 3개 이상.
    - 결과 표 고유 문자열(`props.children`).
- 수정 `tests/e2e/helpers.ts`
  - `CONCEPT_PATH = '/concepts/jsx-to-element'`, `SIMULATOR_NAME = 'JSX element 시뮬레이터'`.
  - `loadConceptsByOrder()`: `readdirSync` + `isDirectory` + `meta.ts` 동적 import + order 정렬. `{ slug, title }[]`를 돌려준다.
- 수정 `tests/e2e/navigation.spec.ts`: 삭제된 5건을 일반식으로 다시 쓴다.
  - '홈 → 검색 → 카드 클릭 → 개념 페이지': 검색어 `객체`. 기대 카드 수는 제목·요약에 `객체`가 든 개념 수(`loadConceptsByOrder`의 title·summary로 계산).
  - '/?q=객체 직접 진입': 입력값 유지, 같은 개수, 콘솔 에러 없음.
  - '학습 순서 보기 전환': 첫 h4가 `1번째`이고 첫 개념 제목, 마지막 h4가 `N번째`, 검색과 함께 URL 유지, 첫 카드 클릭 후 뒤로 가기 시 유지. "걸러져도 전체 순위 유지"는 N≥2일 때만 단언(`test.skip` 조건부).
  - '/?view=order 직접 진입': 카드 N개.
  - '개념 페이지 하단':
    - 첫 개념은 `학습 순서 1 / N`이고 '이전 개념'이 없다.
    - 마지막 개념은 `N / N`이고 '다음 개념'이 없다.
    - N≥2이면 첫 개념에서 다음 링크를 클릭해 `2 / N`으로 이동한다(N=1이면 그 단언은 건너뛴다).
- 수정 `tests/e2e/a11y.spec.ts`(light/dark 루프 안)
  - '홈: 학습 순서 보기'
  - '개념 페이지'
  - '개념 페이지: 시뮬레이터를 진행한 뒤'(시나리오마다 끝까지, 매 단계 axe)
  - '개념 페이지: 퀴즈 정답을 공개한 뒤'
- 수정 `tests/e2e/responsive.spec.ts`
  - 경로 배열에 `CONCEPT_PATH`를 추가한다.
  - '개념 페이지: 시뮬레이터를 끝까지 진행해도 가로 스크롤이 없다'(두 시나리오)
  - '`CONCEPT_PATH`: 하단 학습 순서 내비게이션이 있어도 가로 스크롤이 없다'
  - '홈 학습 순서 보기: 가로 스크롤이 없다'
- 수정 문서
  - `AGENTS.md:119`, `docs/content-guide.md:3`, `:168`
  - `.claude/plans/concept-roadmap.md:3`(상태), `:19`(1번 행 JS 연결·React 18 차이 확정값)
  - `.claude/plans/react-uth-initial-setup.md:293`(후속 작업 체크)
- 변경하지 않음
  - `app/components/**`, `app/lib/**`, `app/simulator/**`의 소스(테스트 파일 추가·수정만)
  - `app/routes*`, `app/root.tsx`, `app/app.css`, 설정 파일, `tests/helpers/**`, `tests/react-examples.test.ts`

## 5. 위험 요소
- 예제 출력이 jsdom과 Chromium에서 다르면 → 한쪽 기대값이 실패한다 → 작업 순서 1에서 두 곳 모두 실행한다.
- 개발 경고(`props.key`, `element.ref`, 리스트 key)가 나면 → 예제가 실패한다 → 3절의 금지 목록, 작업 순서 1.
- 개발 빌드에만 있는 숨은 필드를 기준으로 설명하면 → 독자의 프로덕션 결과와 다르게 서술된다 → 본문은 "props로 전달되지 않는다(`element.key`에 있다)"까지만 쓰고 "props에 key 속성이 전혀 없다"고 쓰지 않는다.
- 본문이 내부 구현(`$$typeof`, Fiber)이나 2번 개념(렌더 단계), 10번(key 역할), 12번(ref 쓰임)을 앞서 설명하면 → 1부 원칙 위반 → 위치만 보이고, simplifications에 "별도 개념에서 다룬다"를 적는다(작업 순서 2).
- react18 Callout에 추정이 섞이면 → 틀린 근거가 된다 → 문서 문장과 실행 결과만 대비하고, 문서가 "18 기준"이라는 원인 판단은 쓰지 않는다. `element.ref`는 "제거"가 아니라 "deprecated, 개발 모드 경고"로 쓴다. 경고를 인용하면 19.3.1의 실제 문구를 쓴다.
- MDX 굵게·인라인 코드 줄바꿈 함정 → 별표가 그대로 보이거나 코드에 공백이 섞인다 → 작업 순서 7에서 빌드 HTML을 grep한다.
- 시뮬레이터 중첩 카드가 375px에서 넘치면 → 가로 스크롤이 생긴다 → responsive e2e, 작업 순서 7 브라우저 확인.
- `skipIf`를 제거한 뒤 개념이 다시 0개가 되면 → build-output이 실패한다 → 개념을 지울 일이 없으므로 수용한다(content-integrity의 '하나 이상'과 같은 전제).
- `vi.mock`이 다른 테스트 파일에 새면 → 회귀가 가려진다 → Vitest는 파일 단위로 격리되고, mock은 `ConceptPager.test.tsx`에만 둔다.
- 테스트를 재추가하면서 기존 단언을 바꾸면 → 회귀가 가려진다 → 기존 테스트는 추가만 한다. 예외는 `skipIf` 제거와 고아 주석 정리이며 4절에 명시했다.

## 6. 검증 방법
- 정적: `npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:build && npm run e2e`. 공통 테스트 파일을 바꾸므로 e2e는 전체를 실행한다.
- 음성 검사
  - 예제 기대값 한 줄을 바꾸면 jsdom과 Chromium 모두 실패하고, 되돌리면 통과한다.
  - 시나리오 1에서 render 전 단계에 `calls`를 넣으면 `concept.test.ts`가 실패하고, 되돌리면 통과한다.
- 브라우저(dev, `/concepts/jsx-to-element`)
  - ① 제목, "검토 중" 배지, 선행 개념 JS 링크 2개(새 창)
  - ② 예제 코드 3개가 하이라이트된다
  - ③ 퀴즈에서 오답을 고르면 정답 번호를 안내한다
  - ④ 시나리오 1을 끝까지 진행하는 동안 render 단계 전까지 "아직 호출되지 않음", 마지막에 출력 5줄
  - ⑤ 시나리오 2에서 `props.children` 행 안에 자식 2개
  - ⑥ 375px·다크 모드에서 `scrollWidth === innerWidth`
  - ⑦ 키보드 →/←/Home
  - ⑧ 콘솔 에러 없음
  - 홈 `/`와 `/?view=order`에 카드 1개와 `1번째`

## 7. 미확정 사항
- [미확정] 시뮬레이터 시나리오 1의 마지막 단계에서 `#root` 상자에 보일 내용. 기본안은 DOM 텍스트 `안녕, 민지`와 "h1"만 보이는 것이다. DOM 구조는 출력으로 검증하지 않으므로 simplifications에 단순화를 적는다. 계획 승인 때 함께 확인한다.

## 8. 작업 순서
### 0. 강조색을 React 색으로 변경 (사용자 요청 2026-11-03)
- 대상: `app/app.css`의 `:root`와 다크 모드 토큰
- 현재: `--accent` #b45309(라이트)/#fcd34d(다크), `--highlight` #fef3c7/#422f0b (amber 계열) — `app/app.css:4-29`. 사용처는 `text-accent`·`bg-accent`·`border-accent`·`bg-highlight`(root, 개념 컴포넌트, 홈 보기 전환, 시뮬레이터 셸·CodeView, StepControls 등).
- 변경: 라이트 `--accent: #08799d`, `--highlight: #e6f7ff` / 다크 `--accent: #58c4dc`, `--highlight: #22282b`. `--accent-fg`는 그대로(라이트 #ffffff, 다크 #1c1917). 주석을 react.dev 기준으로 갱신.
- 이유: 사용자 요청. react.dev 스타일시트에서 `text-link`/`text-brand` = `rgb(8 126 164)`(#087ea4), `text-link-dark`/`text-brand-dark` = `rgb(88 196 220)`(#58c4dc), `bg-highlight` = `rgb(230 247 255)`, 다크 강조 배경 `rgba(88,175,223,.1)`임을 확인. #087ea4는 이 사이트 배경 #fafaf9에서 4.44, #e6f7ff에서 4.22로 AA 미달이라 같은 색상을 4% 어둡게 한 #08799d를 쓴다(사용자 선택). 다크 강조 배경은 react.dev의 반투명 값을 이 사이트 다크 배경 #1c1917에 합성한 단색 #22282b.
- 대비(계산): 라이트 #08799d — bg 4.75, surface 4.96, highlight 4.52, accent-fg/accent 4.96. 다크 #58c4dc — bg 8.61, surface 7.47, highlight 7.36, accent-fg/accent 8.61. fg/highlight 라이트 15.92, 다크 14.30.
- 주의사항: 중립색(bg·surface·fg·muted·border)과 danger·success는 바꾸지 않는다. `public/favicon.svg`(#b45309)와 OG 이미지는 범위 밖(보고만).
- 완료 조건: `grep -n "b45309\|fcd34d\|fef3c7\|422f0b" app/app.css` 결과 없음, 전체 e2e의 axe(light/dark) 통과, 브라우저에서 링크 색 computed `rgb(8, 121, 157)`(라이트).

### 1. 예제 3개 작성과 실제 출력 확정
- 대상: `app/concepts/jsx-to-element/examples/*.jsx`, 임시 `meta.ts`
- 현재: 개념 폴더가 없다.
- 변경
  - 3절의 예제 3개를 쓴다.
  - 임시 `meta.ts`는 `satisfies ConceptMeta`의 전 필드를 채운다(typecheck용). `expectedOutput: []`로 둔다.
  - `npx vitest run tests/react-examples.test.ts`로 실제 출력을 받아 의도와 같은지 확인한 뒤 기록한다.
  - `npm run build` 후 `npx playwright test tests/e2e/react-examples.spec.ts`로 Chromium에서 확인한다.
- 이유: 모든 본문 주장의 근거이고, 가장 불확실한 부분이다.
- 주의사항
  - `%` 금지, 객체를 직접 출력하지 않는다.
  - `element.ref`, `props.key`, `'key' in props`를 쓰지 않는다.
  - 파일 끝에 줄바꿈 1개.
  - 이 단계 동안 `npm test` 전체는 content-integrity(content.mdx 없음)로 실패한다. 대상 파일만 실행한다.
  - 출력이 의도와 다르면 원인을 이해할 때까지 다음 단계로 가지 않는다.
- 완료 조건
  - `tests/react-examples.test.ts`에서 개념 예제 3건이 통과한다.
  - `react-examples.spec.ts`가 desktop에서 통과한다.
  - 기대값 한 줄을 바꾸면 양쪽이 실패하는 것을 확인하고 원복한다.

### 2. meta·route·본문(시뮬레이터 제외)
- 대상: `meta.ts`, `route.tsx`, `content.mdx`
- 변경
  - `npm run js-index:sync` 후 `jsPrerequisites`를 정한다: `function-calls`(함수 호출), `primitives-and-objects`(원시 값과 객체). 앵커는 인덱스에서 확인한다.
  - meta 전 필드
    - title: 로드맵 제목. summary: 160자 이하. goals, tags. prerequisites `[]`, related `[]`. `reviewedAt: null`.
    - simplifications:
      - 내부 필드 생략
      - 실제 빌드는 JSX 런타임 함수를 호출한다
      - 개발 빌드에만 있는 경고용 속성
      - 렌더 과정은 2번 개념에서 다룬다
      - key의 역할(10번)과 ref의 쓰임(12번)은 별도 개념에서 다룬다
      - 클래스 컴포넌트 ref는 다루지 않는다
      - 시뮬레이터 그림은 교육용 표현이다
      - #root 표기의 단순화
    - references: createElement, writing-markup-with-jsx, 업그레이드 가이드(`#deprecated-element-ref`), React 19 글(`#ref-as-a-prop`). 실제로 열어 확인한다.
  - 본문 구성
    - `## 동작 원리`
      - JSX = 함수 호출의 다른 표기. 결과는 객체이고, 만들기 ≠ 호출.
      - 빌드 도구가 함수 호출로 바꾼다.
      - `note` Callout: 불투명하게 다루라는 권고.
    - `## 예제`
      - 예제 3개, 각 예제 뒤에 `PredictQuiz`.
      - 예제 3 뒤에 `<Callout type="react18">`를 둔다.
        - 18에서는 ref가 props와 분리되어 `element.ref`에 있었다(업그레이드 가이드, React 19 글).
        - 19는 ref를 `props.ref`로 받고, `element.ref`는 deprecated이며 개발 모드에서 경고한다.
        - createElement 문서의 Parameters·Returns는 ref가 props에서 빠진다고 쓰지만, 19.3.1 실행 결과는 `props.ref`다.
    - `## 결과와 이유`
      - JSX에 쓴 것 → element 위치를 보여 주는 `<div className="my-6 overflow-x-auto"><table>`: 속성 → `props.<이름>`, 자식 → `props.children`, `key` → `element.key`, `ref` → `props.ref`.
      - `misconception` Callout: "JSX를 쓰면 그 자리에서 컴포넌트가 실행된다".
- 주의사항
  - 1부 원칙.
  - JS 링크는 `<JsLink>`만 쓴다.
  - 굵게와 인라인 코드 함정.
  - h1을 쓰지 않는다.
  - 첫 문단은 일반 문단으로 시작한다(build-output `firstProseLine`).
- 완료 조건
  - `npx vitest run tests/content-integrity.test.ts tests/react-examples.test.ts` 통과.
  - `npm run typecheck` 통과.
  - dev 서버를 재시작한 뒤 `/concepts/jsx-to-element`가 200으로 열린다.

### 3. 시뮬레이터
- 대상: `scenarios.ts`, `ElementObjectView.tsx`, `ElementObjectView.test.tsx`, `Simulator.tsx`, `Simulator.test.tsx`, `concept.test.ts`, `content.mdx`
- 변경
  - `content.mdx`: 예제 2 뒤에 `### 시뮬레이터로 확인하기`, 그다음 독립 줄에 `<Simulator scenarios={scenarios} />`.
  - 3절 상태 모델로 시나리오 2개를 만든다. 코드는 `?raw`로 import한다.
    - `element-object`: 실행 전 → fromJsx 생성 → fromCall 생성 → 로그 줄들 → render.
    - `element-tree`: 실행 전 → card 생성 → 로그 줄들 → render.
  - `Simulator.test.tsx`: J `closure/Simulator.test.tsx` 구조를 따른다. 첫 단계 렌더, 다음·처음으로, ←/→/Home, 라디오·코드 블록 포커스에서 방향키 미가로채기, live region 안내, 시나리오 전환.
  - `ElementObjectView.test.tsx`: 빈 상태 문구, 중첩 children 렌더, 호출 기록 표시.
- 주의사항
  - Step은 전체 스냅샷이다.
  - 시나리오 1의 `calls`와 `root`는 render 단계에서만 채운다.
  - 각 단계의 `output`은 `expectedOutput`의 앞부분이다.
  - 첫 단계는 JS 없이도 보이는 "실행 전" 상태다.
- 완료 조건: `npx vitest run app/concepts/jsx-to-element` 통과. `concept.test.ts`는 다음을 검사한다.
  - 시나리오마다 `assertScenarioInvariants`.
  - 시나리오 id·exampleId·단계 수.
  - 시나리오 1의 `calls`·`root`는 마지막 단계에서만 비어 있지 않다.
  - 상태 props의 값이 같은 단계까지의 `JSON.stringify(props)` 출력 줄과 일치한다.

### 4. 단위·빌드 테스트 재추가
- 대상: `tests/content-integrity.test.ts`, `app/lib/concepts.test.ts`, `app/components/concept/ConceptPager.test.tsx`, `tests/build/build-output.test.ts`
- 변경: 4절 내용.
- 주의사항: 남은 테스트의 단언은 바꾸지 않는다.
- 완료 조건
  - `npm test` 통과, `npm run test:build` 통과.
  - `grep -n skipIf tests/build/build-output.test.ts` 결과 없음.
  - `grep -nE "closure|hoisting|number-type|primitive" tests/build/build-output.test.ts` 결과 없음.

### 5. e2e 재추가
- 대상: `tests/e2e/helpers.ts`, `concept.spec.ts`, `no-js.spec.ts`, `navigation.spec.ts`, `a11y.spec.ts`, `responsive.spec.ts`
- 변경: 4절 내용.
  - `concept.spec.ts`
    - 헤더: h1, "검토 중" 배지, 학습 목표, 선행 개념 JS 링크 2개(`target=_blank`).
    - 퀴즈(예제 1): 선택 전 비활성 → 정답 → 다시 풀기 → 오답 안내.
    - 시나리오 1을 끝까지: 단계 수, 단계별 강조 줄 텍스트, 호출 기록, 최종 출력, 마지막 단계에서 `aria-disabled`, 처음으로.
    - 시나리오 2로 전환하고 끝까지 진행한 뒤의 출력.
    - 키보드: →/←/Home, live region.
    - 모바일 탭.
  - `no-js.spec.ts`
    - 개념 페이지: h2, 본문 문구, 첫 `pre.shiki`에 `const fromJsx`, `<details>` 정답, 시뮬레이터 단계 1 문구.
    - 홈: 개념 링크.
- 주의사항: 시뮬레이터 이름과 경로는 helpers 상수를 쓴다.
- 완료 조건
  - `npm run build` 후 `npx playwright test` 전체 통과.
  - `npx playwright test --list`에 4절의 테스트 이름이 모두 나온다.

### 6. 문서 갱신
- 대상: 4절의 수정 문서
- 변경
  - "개념 0개"·"아직 개념 페이지가 없으므로"·제거 테스트 안내를 "첫 개념 `jsx-to-element`가 참고 구현이고, 개념 e2e가 다시 있다"로 바꾼다.
  - AGENTS.md:119의 navigation 문장은 "개념 수·순서를 meta에서 계산하므로 새 개념 추가 시 고치지 않는다"로 바꾼다.
  - 로드맵: 상태를 갱신하고, 1번 행의 JS 연결과 React 18 차이를 확정값으로 바꾼다.
  - 초기 구축 계획의 후속 작업을 체크한다.
  - 이 문서 "구현 진행"에 기록한다.
- 완료 조건
  - `grep -n "개념 0개\|아직 개념 페이지가 없" AGENTS.md docs/content-guide.md` 결과 없음.
  - 로드맵 1번 행에 "후보"·"작성 시 확인"이 없다.
  - `npm run format:check` 통과.

### 7. 전체 검증과 L7 자체 점검
- 6절의 정적·음성·브라우저 검증을 한다.
- `grep -o '<code>[^<]*  [^<]*</code>' build/client/concepts/jsx-to-element/index.html` 결과가 없어야 한다.
- L7 체크리스트 자체 점검 결과를 "구현 진행"에 기록하고 사용자에게 검토를 요청한다(`reviewedAt`은 승인 후 기록).
- 완료 조건: 검증 명령 전체 통과 출력, 브라우저 확인 8항목 기록.

## 9. 추가 개선 후보
- 초기 구축 리뷰에서 나온 Low 3건(JS 호스트 문자열 중복 등)은 이번 범위 밖이다.

## 변경 이력
- 2026-11-03 (사용자 요청): 사이트 강조색을 react.dev 색으로 변경 — 작업 순서 0 추가. 개발 서버 포트를 8888로(`.claude/launch.json`, 다른 프로젝트가 5173 사용) — 작업 순서 영향 없음

- 2026-11-03 (사용자 검토 의견 8건): 본문·meta·예제 3 주석 수정 — 작업 순서 2·1. ① 단순화 3번을 "key를 쓴 element만" 비열거 key 접근자로 한정(19.3.1 실행: key 없는 jsxDEV·createElement는 `'key' in props` false) ② StrictMode에서 컴포넌트가 두 번 호출되어 로그가 두 번 찍힌다는 단순화 추가(근거: `tests/fixtures/react-examples/strict-mode.jsx` 기대 출력의 render 2회. "18부터 숨기지 않음" 같은 버전 이력은 미확인이라 쓰지 않음) ③ react18 Callout의 title이 라벨 "React 18에서는"과 중복 → title 제거 ④ 자식이 하나면 그 값, 둘 이상이면 배열(예제 2 h2·section) ⑤ key는 문자열로 바뀜(react.dev createElement "coerced to a string", 19.3.1 `key={0}` → `"0"`) ⑥ type의 단순화(19.3.1: Fragment는 symbol, memo·forwardRef는 object, 클래스는 function)와 "그 이름의 변수 값이 type" ⑦ 클래스 ref: element의 `props.ref`에는 있지만(19.3.1 실행) 인스턴스 `this.props`로는 전달되지 않음(React 19 글) ⑧ 예제 3에 실제로는 useRef를 쓴다는 주석. 접근 방식·범위 변화 없음 → 상태 `승인` 유지

## 구현 진행

- baseline (2026-11-03, `b1c94a8` + launch.json·계획 문서): lint·format:check·typecheck 통과 / vitest 17 files·93 통과 / test:build 16 통과 / playwright 32 passed·4 skipped
- [x] 0. 강조색 변경 — `app/app.css:11,13,25,27`만 변경, 옛 amber 값 grep 결과 없음, dev 브라우저 `/about` 링크 computed 라이트 `rgb(8, 121, 157)`·다크 `rgb(88, 196, 220)`, `--highlight` 라이트 `#e6f7ff`·다크 `#22282b`. 대비 계산: muted/highlight 6.94·5.92, danger 5.89·7.87, success 4.56·10.63(모두 AA). axe는 전체 e2e(작업 7)에서 확인
- [x] 1. 예제 3개와 실제 출력 — 예제 원문이 계획과 같음(메인 확인). jsdom `tests/react-examples.test.ts` 9 통과(개념 3), build 후 `react-examples.spec.ts` desktop 7 passed. 음성: element-tree 기대값 `true 2`→`true 3`이면 jsdom 1 failed·Chromium 1 failed, 원복 후 통과. 출력: element-object `object true`/`{"name":"민지"}`×2/`false`/`Greeting 호출: 민지`, element-tree `section card`/`true 2`/`h2 제목`/`string`, key-and-ref `q`/`["ref","placeholder"]`/`true`
- [x] 2. meta·route·본문 — `npm run js-index:sync`(31→33개), content-integrity·react-examples 통과, typecheck·lint 통과, 빌드 HTML에 react.dev 링크 5종(createElement, writing-markup, 업그레이드 가이드 2앵커, React 19 글) 렌더, `**` 0건, `<code>` 공백 grep 0건. 메인 검토로 본문 2문장 수정("컴포넌트 함수도 … 만들어지지 않습니다" → 호출되지 않음, "render에 넘기면 그때" → 동기 호출로 읽히지 않게)
- [x] 3. 시뮬레이터 — 시나리오 2개(각 7단계), `Simulator.test.tsx`·`ElementObjectView.test.tsx`·`concept.test.ts` 포함 vitest 21 files·141 통과. 음성: element-object 6단계에 calls 넣으면 concept.test 1 failed, 원복 후 통과
- [x] 4. 단위·빌드 테스트 재추가 — content-integrity '개념이 하나 이상', concepts.test 'listConcepts / getConcept' 3건·'getAdjacentConcepts' 일반식 4건, `ConceptPager.test.tsx`(vi.mock 스텁 4건), build-output `skipIf` 2곳·고아 주석 제거, '시뮬레이터 프리렌더 (jsx-to-element)' 5건. `grep -nE "closure|hoisting|number-type|primitive|skipIf"` 결과 없음. 메모: 서브에이전트가 `firstProseLine` 헬퍼를 고쳐(첫 태그 앞까지 자르기) 통과시켰으나, 기존 검사를 약화하고 "새 개념은 공통 테스트를 고치지 않는다" 원칙에 어긋나 메인이 되돌리고 본문 첫 문단의 `<JsLink>` 문장을 둘째 문단으로 분리
- [x] 5. e2e 재추가 — helpers(`CONCEPT_PATH`, `SIMULATOR_NAME`, `loadConceptsByOrder` — `filterConcepts`와 같은 기준을 위해 `tags` 포함), concept.spec 6건, no-js.spec 2건, navigation 5건(개념 수·순위는 meta에서 계산, N≥2 전용 단언은 `if` 분기), a11y light/dark 각 4건, responsive 3건 + 경로 배열
- [x] 6. 문서 갱신 — AGENTS.md:119, content-guide:3·168, 로드맵 상태·1번 행, 초기 구축 계획 후속 작업 체크. `grep "개념 0개\|아직 개념 페이지가 없"` 결과 없음. AGENTS.md는 `loadConceptsByOrder`(작업 5에서 추가)를 가리킴
- [x] 7. 전체 검증 — 메인 재실행: lint·format:check·typecheck 통과, vitest 21 files·141 통과, test:build 26 통과, playwright 82 passed·10 skipped(모바일 전용 skip), `<code>` 공백 grep 0. 브라우저(dev 8888): 페이지 200·실패 요청 0·콘솔 에러 0, 시나리오 1 끝까지 진행 시 7단계에서만 `Greeting({ name: "민지" })`·`#root <h1> 안녕, 민지`, 375px·다크에서 두 시나리오 끝까지 진행해도 가로 넘침 0, 링크색 다크 `rgb(88, 196, 220)`. 퀴즈·키보드·axe는 e2e(concept.spec, a11y)로 확인
- 리뷰 1차(critical-code-review, 메인 직접): Critical 0 · High 0 · Medium 0 · Low 3(보고만) — ① `public/favicon.svg`(#b45309)와 OG 이미지가 옛 amber 색 그대로(강조색 변경 범위 밖) ② meta simplifications 3번(개발 빌드의 숨은 `key` 접근자)은 문서화되지 않은 관찰 동작이라 AGENTS.md 규칙대로 "19.3.1 개발 빌드에서는"으로 버전을 한정하면 더 정확 ③ navigation e2e의 검색어 `객체`는 일치하는 개념이 1개 이상이라고 가정(현재 제목에 포함되어 성립)
- [x] 검토 의견 반영(변경 이력 2026-11-03 8건) — 실행 확인(19.3.1): key 없는 element `'key' in props` false·있으면 true, `key={0}` → `"0"`, 클래스 type element의 `props.ref` 존재, Fragment symbol·memo/forwardRef object·클래스 function, 예제 1을 StrictMode로 감싸면 `Greeting 호출: 민지` 2회(jsdom 스크래치 실행). 메인 재실행: lint·format:check·typecheck 통과, vitest 141, test:build 26, playwright 82 passed·10 skipped, `<code>` 공백 0, 빌드 HTML의 "React 18에서는" 1회(중복 해소)
- 재리뷰(수정 범위): Critical·High 0. 남은 Low는 리뷰 1차 ①③(파비콘·OG 색, `객체` 검색 가정). ②는 이번 수정으로 해소
- 마무리(2026-11-03, 사용자 최종 승인): content-guide 10단계에 따라 `meta.reviewedAt: '2026-11-03'`. 이에 따라 `tests/e2e/concept.spec.ts`의 "검토 중" 배지 단언을 "검토일 2026-11-03"으로 바꿈(사용자 확인). 메인 재실행: format:check·typecheck 통과, vitest 141, test:build 26(sitemap `lastmod 2026-11-03`), playwright 82 passed·10 skipped. main에 직접 커밋(사용자 선택)

## 구현 결과

### 계획 대비 실제 구현
- 작업 순서 0~7을 계획대로 구현했다. 달라진 점:
  - 사용자 요청으로 작업 0(강조색 react.dev 색, 라이트 #08799d·다크 #58c4dc)과 개발 서버 포트 8888이 추가됐다(변경 이력).
  - 사용자 검토 의견 8건을 반영했다. key 접근자는 key를 쓴 element에만 있다는 점, StrictMode에서 로그 2회, children 하나/여럿 규칙, key의 문자열 변환, type의 다른 값, 클래스 ref 구분, 예제 3 주석, Callout 제목 중복 제거다(변경 이력).
  - e2e `loadConceptsByOrder`에 `tags`를 더했다. `filterConcepts`와 같은 기준으로 검색 결과 수를 계산하기 위해서다.
  - 본문 첫 문단에 `<JsLink>`가 있으면 build-output `firstProseLine` 검사가 실패한다. 헬퍼를 고치지 않고 링크 문장을 둘째 문단으로 옮겼다.
  - 미확정 1건(#root 표기)은 기본안대로 했다. `<h1> 안녕, 민지`처럼 태그 이름과 텍스트만 보이고 simplifications에 적었다.
  - JS 사이트 인덱스가 31개에서 33개로 갱신됐다(`npm run js-index:sync`).

### 코드 리뷰
- Critical·High 0건이다. Low 2건은 고치지 않고 남겼다(아래 후속 작업). 단순화 목록의 버전 한정 Low는 검토 의견 반영 때 해소됐다.

### 후속 작업
- [ ] (선택) `public/favicon.svg`와 OG 이미지(`npm run og:generate`)를 새 강조색에 맞출지 결정
- [ ] (선택) navigation e2e의 검색어 `객체`는 일치하는 개념이 1개 이상이라고 가정한다. 개념 구성이 바뀌어 0개가 되면 검색어를 바꾼다
- [ ] 로드맵 2번 "렌더링은 컴포넌트 함수를 호출하는 것" 작성(이 페이지가 렌더 과정을 그 개념으로 넘김)

### 이해 확인

#### 설명할 수 있어야 하는 기술적 판단
- [Claude 판단] 예제는 element 전체를 `JSON.stringify`하지 않고 `type`, `JSON.stringify(props)`, `Object.keys(props)`만 출력한다. 19.3.1의 element는 개발 빌드(`_owner`, `_store`, freeze)와 프로덕션 빌드(`ref` 필드, freeze 없음)의 구성이 달라서, 전체를 출력하면 독자 환경에 따라 결과가 달라진다. 버린 대안: 전체 출력, `$$typeof` 출력.
- [Claude 판단] "key는 props로 전달되지 않는다"는 `'key' in props`가 아니라 `Object.keys(props)`로 보였다. 개발 빌드는 key를 쓴 element의 props에 비열거 경고 접근자를 둬서 `'key' in props`가 true가 된다(Architect·Critic 검토에서 발견, 실행 확인).
- [Claude 판단] 예제는 react.dev가 문서화한 `createElement`로 JSX와 비교했다. `react/jsx-runtime`의 `jsx`는 import하지 않았다. 실제 빌드는 JSX 런타임 함수(Vite 개발 `jsxDEV`, 프로덕션 `jsx`)를 부르지만, 그 API는 react.dev 공개 문서가 아니라서 본문에 함수 이름을 쓰지 않고 simplifications에만 적었다.
- [Claude 판단] 개념 테스트를 다시 넣으면서 개념 수·순서를 고정하지 않았다. e2e는 `meta.ts` 동적 import(`loadConceptsByOrder`), 단위 테스트는 레지스트리 일반식으로 계산한다. `ConceptPager`만 `vi.mock`으로 첫·중간·마지막을 검증한다. 버린 대안: JS 원본처럼 개념 수를 하드코딩하는 방식(개념을 추가할 때마다 공통 테스트를 고쳐야 한다).
- [Claude 판단] 시뮬레이터 상태에서 children을 element의 별도 필드가 아니라 props의 한 행으로 그렸다. 실제 구조(`props.children`)와 그림이 어긋나지 않게 하기 위해서다(Architect 지적).
- 강조색은 react.dev의 #087ea4가 이 사이트 배경에서 대비 4.44로 AA 미달이라, 같은 색상을 4% 어둡게 한 #08799d를 썼다(사용자 선택).
- ref는 createElement 문서 문장이 아니라 실행 결과와 업그레이드 가이드를 근거로 `props.ref`라고 설명했고, 문서와의 차이를 Callout에 밝혔다(사용자 선택).

#### 배경지식
- React 19.3.1 element: `type`·`props`·`key`를 가진 객체다. 개발 빌드에서는 element와 props를 얕게 freeze한다(react.dev createElement Caveats). key는 문자열로 바뀌어 `element.key`에 들어가고, ref는 19부터 `props.ref`에 들어간다(`element.ref`는 deprecated, 읽으면 개발 경고).
- element를 만드는 것은 컴포넌트를 호출하지 않는다. 컴포넌트는 React가 그 element를 렌더할 때 호출된다(react.dev createElement Deep Dive, 예제 1 출력).
- 이 사이트의 예제 실행기는 jsdom과 Chromium에서 개발 빌드 React로 예제를 실행한다. console.error나 console.warn이 하나라도 나오면 실패하므로, `element.ref`나 `props.key`를 읽는 예제는 쓸 수 없다.
- StrictMode는 개발 빌드에서 컴포넌트를 두 번 호출한다(픽스처 `strict-mode.jsx`, 예제 1을 감싼 실행에서 로그 2회).

#### 확인 질문
1. 예제 3에서 key가 props에 없음을 보이려고 `'key' in field.props`를 쓰면 무엇이 문제인가?
   <details><summary>답</summary>개발 빌드(실행기도 개발 빌드)는 key를 쓴 element의 props에 비열거 경고 접근자 `key`를 둔다. 그래서 결과가 `true`가 되어 설명과 반대가 되고, `props.key`를 읽으면 console.error가 나서 예제가 실패한다. 그래서 `Object.keys`로 열거 가능한 키만 보였다(2절 사실, meta simplifications).</details>
2. 왜 예제에서 element 전체를 `JSON.stringify`하지 않았나? 프로덕션 빌드에서 돌리면 무엇이 달라지나?
   <details><summary>답</summary>개발 빌드는 `_owner`·`_store`가 열거되고 freeze되며, 프로덕션은 `ref` 필드가 열거되고 freeze되지 않는다. 그래서 전체 출력은 빌드마다 다르다. type·props·key는 두 빌드에서 같다(2절 실행 확인).</details>
3. 다음 개념을 추가할 때 `navigation.spec.ts`나 `concepts.test.ts`를 고쳐야 하나? 어떤 조건에서 고쳐야 하나?
   <details><summary>답</summary>고치지 않아도 된다. 개념 수·순서·제목을 meta(레지스트리, `loadConceptsByOrder`)에서 계산하기 때문이다. 다만 검색어 `객체`에 맞는 개념이 0개가 되면 검색 테스트의 `matched[0]` 가정이 깨진다. 또 개념 페이지 e2e(`concept.spec`, `no-js.spec`)는 첫 개념 전용이라 새 개념의 e2e는 따로 추가한다(AGENTS.md 검증 순서, content-guide 7·9절).</details>
4. 강조색을 react.dev와 똑같은 #087ea4로 쓰면 어디서 무엇이 실패하나?
   <details><summary>답</summary>라이트 배경 #fafaf9에서 대비 4.44, 강조 배경 #e6f7ff 위에서 4.22로 AA(4.5)에 못 미친다. 홈 보기 전환 버튼(`text-accent` on `bg-highlight`) 같은 곳에서 axe e2e가 실패한다(작업 순서 0).</details>
5. 시뮬레이터 7단계는 "React가 Greeting을 한 번 호출"한다고 보여 준다. 독자가 StrictMode로 감싼 앱에서 예제를 돌리면 왜 결과가 다른가?
   <details><summary>답</summary>StrictMode는 개발 빌드에서 컴포넌트를 두 번 호출하므로 `Greeting 호출: 민지`가 두 번 찍힌다. 예제는 StrictMode 없이 렌더하고, 이 차이는 simplifications에 적었다. 이유는 로드맵 3번 개념에서 다룬다(변경 이력 검토 의견 ②).</details>

# 개념 2: 렌더링은 컴포넌트 함수를 호출하는 것 (render-and-commit) 구현 계획

- 상태: 완료
- 작성일: 2026-11-12
- 기준: `main` @ `6764ca3` (+ 커밋하지 않은 JS 인덱스 동기화·로드맵 JS 연결 갱신)

## 0. 요약
- 목적: 로드맵 2번 개념 페이지 `/concepts/render-and-commit`(예제 3개, 시뮬레이터 시나리오 2개)을 추가해 트리거 → 렌더 → 커밋을 실행 결과로 보인다.
- 범위: `app/concepts/render-and-commit/` 신규, e2e `a11y`·`responsive`에 이 개념 케이스 추가(기존 케이스는 고치지 않음), 로드맵 2번 상태 / 공통 컴포넌트·`app/lib`·`app/simulator`·설정은 바꾸지 않음
- 위험: 커밋을 MutationObserver로 관찰하므로 DOM 연산의 개수·종류처럼 react.dev가 보장하지 않는 세부를 사실처럼 쓸 수 있음 → 바뀐 요소 이름만 중복 없이 출력하고, jsdom·Chromium 두 곳에서 같은 출력을 확인(시제품 확인 완료)
- 복잡도: 중간 · Consensus: 생략 (첫 개념의 구조를 그대로 따르고 공통 코드를 바꾸지 않음. 내용 정확성은 실행 검증, critical-code-review, 사용자 L7 검토로 확인)
- 미확정: 없음

## 1. 요구사항
- 요구사항
  - 로드맵 2번 "렌더링은 컴포넌트 함수를 호출하는 것: 트리거 → 렌더 → 커밋"(category `rendering`, order 20). 1부 공개 동작 페이지라 내부 구현(Fiber, work loop 등)은 쓰지 않는다.
  - slug `render-and-commit`(사용자 확정, 2026-11-12).
  - 시뮬레이터 포함(사용자 확정).
  - 커밋은 MutationObserver 관찰 코드로 "바뀐 요소"를 출력해 보인다(사용자 확정).
  - `reviewedAt: null`. 구현·리뷰 후 사용자 검토(가이드 10단계)를 받는다.
- 유지해야 하는 기존 동작: 공통 컴포넌트, 시뮬레이터 셸, 라우트, SEO, 하이드레이션 규칙, 기존 테스트의 단언(e2e는 추가만 한다), 첫 개념 페이지.
- 제외 범위
  - 3번 이후 개념 내용: StrictMode·순수성(3), state 스냅샷(5), 배칭(6), 부모가 렌더되면 자식도 렌더(8), effect(13). 필요한 곳은 `simplifications`에 "별도 개념에서 다룬다"로 적는다.
  - `react18` Callout(로드맵 "React 18 차이: -").
  - `jsx-to-element` 수정(그 페이지의 simplifications가 이 개념을 이름으로 가리키지만 링크로 바꾸지 않음 → 9절 후보).
  - 커밋, `reviewedAt` 날짜 기록.

## 2. 사실과 추정
### 사실 (코드·문서·실행에서 확인)
- 새 개념은 폴더 추가만으로 라우트·홈·sitemap·공통 테스트에 잡힌다 — `docs/content-guide.md:1-30`, 7절. 첫 개념의 구성(`meta.ts`, `content.mdx`, `route.tsx`, `examples/`, `scenarios.ts`, `Simulator.tsx`, 시각화 `ElementObjectView.tsx`, `concept.test.ts`, `Simulator.test.tsx`, `ElementObjectView.test.tsx`)을 그대로 따른다 — `app/concepts/jsx-to-element/`.
- 시뮬레이터 래퍼는 `SimulatorShell`에 `scenarios`, `label`, `renderState`만 넘긴다 — `app/concepts/jsx-to-element/Simulator.tsx:11-18`. `Step`은 `title`, `explanation`, `line?`, `state`, `output?` — `app/simulator/types.ts:3-9`.
- 예제 실행기는 모듈 import 후 settle, `interactions`의 click마다 settle하고 `console.log`를 모은다. `console.error/warn`이나 예외가 있으면 errors에 쌓인다 — `tests/helpers/run-react-example.ts:10-75`.
- 본문 첫 문단에 `<JsLink>`를 두면 build-output `firstProseLine` 검사가 실패한다(첫 개념 구현 진행 기록) — `.claude/plans/concept-jsx-to-element.md` "구현 진행" 작업 4.
- e2e `a11y.spec.ts`·`responsive.spec.ts`의 시뮬레이터 진행 케이스는 첫 개념 전용(`CONCEPT_PATH`, `SIMULATOR_NAME`) — `tests/e2e/helpers.ts:8-9`, `tests/e2e/a11y.spec.ts:56-72`, `tests/e2e/responsive.spec.ts:5-33`. content-guide 9절은 시뮬레이터가 있는 새 개념의 경로와 진행 검사를 이 두 파일에 "추가만" 하라고 한다.
- JS 인덱스(2026-11-12 동기화): `function-calls` 존재, `dom-tree-nodes`의 앵커 `노드-종류와-nodetype-nodename` 존재 — `app/lib/js-site-index.json`.
- react.dev 근거(2026-11-12 열어 확인)
  - [Render and Commit](https://react.dev/learn/render-and-commit): 화면 갱신은 트리거·렌더·커밋 세 단계다. 트리거는 첫 렌더(`createRoot` + `render`)와 state 업데이트다. 렌더는 React가 컴포넌트를 호출하는 것이고, 첫 렌더는 루트 컴포넌트, 다시 렌더할 때는 state 업데이트를 일으킨 함수 컴포넌트를 호출한다. 반환한 JSX에 컴포넌트가 있으면 이어서 렌더한다(재귀). 커밋에서 DOM을 바꾸며, 첫 렌더는 `appendChild()`로 붙이고, 다시 렌더할 때는 렌더 사이에 차이가 있는 DOM 노드만 바꾼다. 렌더가 항상 DOM 변경을 만들지는 않는다. 그 뒤 브라우저가 화면을 다시 칠하는 것을 문서는 "painting"이라 부른다. 앵커: `#step-1-trigger-a-render`, `#step-2-react-renders-your-components`, `#step-3-react-commits-changes-to-the-dom`, `#epilogue-browser-paint`.
  - [createRoot](https://react.dev/reference/react-dom/client/createRoot) `root.render` Caveats: 렌더는 시작되면 동기이지만 `root.render(...)` 호출 자체는 동기가 아니다. 문서 예시도 `root.render()` 바로 뒤에서는 HTML에 아직 렌더 결과가 없다고 보인다.
- 시제품 실행(scratchpad, 프로젝트 실행기 `runReactExample`과 Vite 개발 빌드 + Playwright Chromium, React 19.3.1): 아래 8절 예제 원문 그대로 jsdom·Chromium 출력이 같고 errors 0건이다.
  - `first-render`(상호작용 없음): `render 호출 직후, #root 자식 수: 0` / `App 렌더, #root 자식 수: 0` / `Title 렌더` / `Count 렌더` / `DOM 변경: ["#root"]`
  - `state-update`(click 1회): `App 렌더` / `Title 렌더` / `Counter 렌더: count 0, 화면 없음` / `DOM 변경: ["#root"]` / `Counter 렌더: count 1, 화면 0` / `DOM 변경: ["output"]`
  - `same-result`(click 2회): `Status 렌더: clicks 0` / `DOM 변경: ["#root"]` / `Status 렌더: clicks 1` / `DOM 변경: ["p"]` / `Status 렌더: clicks 2`
  - 중복 제거 전 레코드 종류는 첫 커밋이 `#root childList`, 텍스트 변경이 `output characterData`였다. 이 종류는 react.dev가 정하지 않으므로 출력하지 않는다(요소 이름만 출력).

### 추정
- 없음

## 3. 구현 전략
- **예제 3개로 세 단계를 나눠 보인다.**
  1. `first-render`: 트리거(첫 렌더)는 요청일 뿐이다. `root.render` 다음 줄이 컴포넌트보다 먼저 찍히고(createRoot Caveat), React가 App → Title → Count 순서로 호출하며(재귀), 렌더 중에는 `#root`가 비어 있고, 커밋에서 `#root`에 한 번에 붙는다.
  2. `state-update`: state 업데이트 트리거는 그 state를 가진 Counter만 호출한다(App·Title 호출 없음). Counter 렌더 중 화면은 아직 이전 값(`화면 0`)이고, 커밋에서 `output`만 바뀐다(h1·button은 그대로).
  3. `same-result`: 다시 렌더했지만 결과가 같으면 커밋에서 DOM이 바뀌지 않는다(두 번째 클릭 뒤 `DOM 변경` 줄이 없음).
- **관찰 장치**: 세 예제에 같은 MutationObserver 코드(8줄)를 둔다. 바뀐 노드가 텍스트면 부모 요소로 올리고, id가 있으면 `#id`, 없으면 태그 이름을 중복 없이 찍는다. 레코드 수·종류를 찍지 않아 구현 세부에 기대지 않는다. 본문 `note` Callout에서 두 가지를 밝힌다. MutationObserver는 DOM이 바뀐 뒤에 콜백을 부르는 브라우저 API라는 점, 그리고 렌더 중에 DOM을 읽는 코드(`rootNode.childNodes.length`, `querySelector('output')`)는 관찰용이며 실제 컴포넌트에서는 쓰지 않는다는 점이다(이유는 3번 개념).
- **"렌더 중 DOM은 그대로"의 근거**: MutationObserver 콜백은 나중에 불리므로 출력 순서만으로는 증명되지 않는다. 그래서 렌더 중에 DOM을 직접 읽어(`#root 자식 수: 0`, `화면 0`) 보인다.
- **용어**: react.dev를 따라 "트리거(trigger)", "렌더(render)", "커밋(commit)", "다시 렌더(re-render)", "페인트(paint)"로 쓴다. 한 페이지 안에서 "렌더"와 "렌더링"은 같은 뜻으로 섞지 않고 단계 이름은 "렌더"로 통일한다(제목은 로드맵 문구 유지).
- **시뮬레이터**: 상태 모양은 이 개념 전용이다.
  ```ts
  type Phase = 'idle' | 'trigger' | 'render' | 'commit'
  type RenderedCall = { name: string; returns: string } // 이번 렌더에서 호출한 컴포넌트와 돌려준 JSX 요약
  type DomLine = { depth: number; label: string; changed: boolean } // #root 안 DOM을 들여쓴 줄 목록으로 요약
  type RenderCommitState = {
    phase: Phase
    trigger: string | null // 이번 렌더를 일으킨 것. 예: 'root.render(<App />)', 'setCount(count + 1) → count 1'
    rendered: RenderedCall[] // 이번 렌더(트리거 이후)에서 호출된 순서. 트리거 단계에서는 []
    dom: DomLine[] | null // null = #root 비어 있음
  }
  ```
  시각화 `RenderCommitView`는 네 영역을 세로로 둔다: 단계 표시(트리거/렌더/커밋, 현재 단계는 굵게 + "현재" 텍스트), 트리거, 이번 렌더에서 호출한 컴포넌트(이름 + 돌려준 JSX), `#root`의 DOM. 커밋에서 바뀐 줄에는 "바뀜" 텍스트 배지를 단다(색만으로 구분하지 않음). 두 패널을 나란히 두지 않고 세로로 쌓아 375px에서 넘치지 않게 한다.
- 버린 대안
  - 커밋 관찰을 DOM 노드 동일성(`===`) 비교로 하기: "결과가 같으면 DOM을 건드리지 않음"을 보이기 어렵다(사용자 선택).
  - `useEffect`나 ref 콜백으로 커밋 뒤를 관찰하기: 아직 쓰지 않은 개념(12·13번)을 앞당긴다.
  - 예제 2에 자식 컴포넌트를 두기: Counter 아래에 컴포넌트가 있으면 "부모가 렌더되면 자식도"(8번)를 앞당긴다. Counter는 호스트 요소만 돌려준다.
  - 시뮬레이터에서 렌더 결과 전체 트리와 DOM을 나란히 비교하기: 다시 렌더할 때 호출되지 않은 컴포넌트의 결과를 어떻게 그릴지 새 가정이 필요하다. 호출한 컴포넌트가 돌려준 것만 보인다.

## 4. 변경 파일
- 추가 `app/concepts/render-and-commit/`
  - `meta.ts`, `content.mdx`, `route.tsx`(첫 개념 route 복사)
  - `examples/first-render.jsx`, `examples/state-update.jsx`, `examples/same-result.jsx`
  - `scenarios.ts`, `RenderCommitView.tsx`, `Simulator.tsx`
  - `concept.test.ts`, `Simulator.test.tsx`, `RenderCommitView.test.tsx`
- 수정 `tests/e2e/helpers.ts`: `RENDER_COMMIT_PATH = '/concepts/render-and-commit'`, `RENDER_COMMIT_SIMULATOR_NAME = '렌더와 커밋 시뮬레이터'` export를 추가(기존 상수는 그대로).
- 수정 `tests/e2e/a11y.spec.ts`: light/dark 각각 "render-and-commit: 시뮬레이터를 진행한 뒤" 케이스 추가.
- 수정 `tests/e2e/responsive.spec.ts`: "render-and-commit: 가로 스크롤이 없다"와 "render-and-commit: 시뮬레이터를 끝까지 진행해도 가로 스크롤이 없다" 추가.
- 수정 `.claude/plans/concept-roadmap.md`: 상태 줄과 2번 행의 JS 연결을 확정 값으로.
- 변경하지 않음: `app/components/`, `app/simulator/`, `app/lib/`(이미 동기화된 `js-site-index.json` 제외), `app/routes*`, 설정, `tests/helpers/`, `tests/build/`, 기존 e2e 케이스, `jsx-to-element`.

## 5. 위험 요소
- MutationObserver 출력이 환경마다 다를 수 있다 → 요소 이름만 중복 없이 찍고, jsdom(`npm test`)과 Chromium(`react-examples.spec.ts`)에서 같은 `expectedOutput`을 대조한다(작업 1, 6). 다르면 기대값을 고치지 말고 원인을 찾는다.
- 본문이 react.dev가 보장하지 않는 세부(DOM 연산 개수·종류, `root.render` 뒤 정확히 언제 렌더되는지)를 사실처럼 쓸 수 있다 → 본문은 2절의 react.dev 문장과 실행 결과만 쓰고, 나머지는 `simplifications`에 적는다(작업 2, 7 L7 점검).
- 렌더 중 DOM을 읽는 예제 코드를 독자가 따라 할 수 있다 → 코드 주석과 `note` Callout으로 관찰용임을 밝힌다(작업 2).
- 예제 3의 두 번째 클릭 뒤 출력이 없다는 점이 실행기 settle에 기대는 것처럼 보일 수 있다 → 실행기는 클릭 뒤에도 출력이 더 늘지 않는지 확인하므로(`run-react-example.ts:10-19`), 마지막 줄이 `Status 렌더: clicks 2`인 것이 곧 커밋에 DOM 변경이 없었다는 관찰이다. 시제품 두 환경에서 확인함.
- 시뮬레이터 `line`이 예제 줄 번호와 어긋날 수 있다 → 예제 원문을 8절과 똑같이 두고 `assertScenarioInvariants`가 범위를 검사한다(작업 3).
- 본문 첫 문단에 `<JsLink>`를 두면 build-output 검사가 실패한다 → JS 링크 문장은 둘째 문단에 둔다(작업 2).
- `**…**` 닫는 별표 뒤 한글, 인라인 코드의 줄바꿈 공백 → content-guide 4절 규칙과 빌드 후 grep으로 확인한다(작업 2, 6).
- e2e 추가 케이스가 기존 케이스를 바꾸면 안 된다 → 추가만 하고 `git diff`에서 삭제 줄이 없는지 확인한다(작업 5).
- 에지 케이스: StrictMode로 감싸면 렌더 로그가 두 번 찍힌다 → 예제는 StrictMode 없이 렌더하고 `simplifications`에 적는다.

## 6. 검증 방법
- 정적·단위: `npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:build`
- e2e(공통 코드를 바꾸지 않으므로 범위 실행): `npx playwright test tests/e2e/navigation.spec.ts tests/e2e/react-examples.spec.ts && npx playwright test -g "render-and-commit"`. 추가한 a11y·responsive 케이스 이름에 모두 `render-and-commit`을 넣어 `-g`로 잡히게 한다.
- 빌드 결과 grep: `grep -o '<code>[^<]*  [^<]*</code>' build/client/concepts/render-and-commit/index.html` 결과 없음, 본문에 `**` 그대로 남은 곳 없음.
- 브라우저(dev 서버 재시작 후 `/concepts/render-and-commit`)
  1. 페이지 200, 콘솔 에러 0, 실패 요청 0.
  2. 시뮬레이터 시나리오 1: 1~6단계는 `#root` "비어 있음", 7단계(첫 커밋)에서 DOM 줄이 모두 "바뀜", 9단계(Counter 렌더)에서 호출 목록이 Counter 하나이고 DOM의 output은 `0`, 10단계에서 output 줄만 "바뀜"이고 값이 `1`.
  3. 시나리오 2: 마지막 단계(커밋)에서 "바뀜" 배지가 하나도 없고 콘솔 출력이 앞 단계와 같다.
  4. 375px·다크 모드에서 두 시나리오를 끝까지 진행해도 가로 넘침이 없다(`document.documentElement.scrollWidth <= innerWidth`).
  5. 퀴즈 3개가 하이드레이션 후 라디오로, JS 없이 `<details>`로 보인다(test:build가 검사).

## 7. 미확정 사항
- 없음

## 8. 작업 순서

### 1. 예제 3개 작성과 출력 확정
- 대상: `app/concepts/render-and-commit/examples/*.jsx`, `meta.ts`(examples만 먼저)
- 현재: 없음(시제품만 scratchpad에 있음)
- 변경: 아래 원문 그대로 만든다(파일 끝 줄바꿈 하나). `meta.examples`에 등록한다: `first-render`(상호작용 없음), `state-update`(`interactions: [{ type: 'click', selector: 'button' }]`), `same-result`(같은 click 2개). 처음에는 `expectedOutput: []`로 두고 `npm test`의 실제 출력을 확인한 뒤 2절 출력과 같으면 채운다.
- 이유: 모든 결과 주장의 근거다.
- 주의사항: 줄 번호는 시뮬레이터 `line`이 쓰므로 원문을 바꾸지 않는다. `console.log` 문자열에 `%`를 쓰지 않는다.
- 완료 조건: `npx vitest run tests/react-examples.test.ts`에서 `render-and-commit` 예제 3개 통과, 기대값이 2절 출력과 줄 단위로 같다. 음성 확인: `same-result` 기대값 끝에 `DOM 변경: ["p"]`를 하나 더 붙이면 실패하고, 되돌리면 통과한다.

`examples/first-render.jsx`
```jsx
import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')

function Title() {
  console.log('Title 렌더')
  return <h1>카운터</h1>
}

function Count() {
  console.log('Count 렌더')
  return <output>0</output>
}

function App() {
  console.log('App 렌더, #root 자식 수: ' + rootNode.childNodes.length)
  return (
    <main>
      <Title />
      <Count />
    </main>
  )
}

// 관찰용 코드(React 기능 아님): #root 안의 DOM이 바뀌면 바뀐 요소의 이름을 찍습니다.
new MutationObserver((records) => {
  const changed = records.map((r) => {
    const node = r.target.nodeType === Node.TEXT_NODE ? r.target.parentNode : r.target
    return node.id ? '#' + node.id : node.nodeName.toLowerCase()
  })
  console.log('DOM 변경: ' + JSON.stringify([...new Set(changed)]))
}).observe(rootNode, { childList: true, subtree: true, characterData: true })

createRoot(rootNode).render(<App />)
console.log('render 호출 직후, #root 자식 수: ' + rootNode.childNodes.length)
```
(줄 번호: Title 5-8, Count 10-13, App 15-23, 관찰 코드 25-32, render 34, 직후 로그 35)

`examples/state-update.jsx`
```jsx
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')

function Title() {
  console.log('Title 렌더')
  return <h1>카운터</h1>
}

function Counter() {
  const [count, setCount] = useState(0)
  const shown = rootNode.querySelector('output')?.textContent ?? '없음'
  console.log('Counter 렌더: count ' + count + ', 화면 ' + shown)
  return (
    <>
      <output>{count}</output>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </>
  )
}

function App() {
  console.log('App 렌더')
  return (
    <main>
      <Title />
      <Counter />
    </main>
  )
}

// 관찰용 코드(React 기능 아님): #root 안의 DOM이 바뀌면 바뀐 요소의 이름을 찍습니다.
new MutationObserver((records) => {
  const changed = records.map((r) => {
    const node = r.target.nodeType === Node.TEXT_NODE ? r.target.parentNode : r.target
    return node.id ? '#' + node.id : node.nodeName.toLowerCase()
  })
  console.log('DOM 변경: ' + JSON.stringify([...new Set(changed)]))
}).observe(rootNode, { childList: true, subtree: true, characterData: true })

createRoot(rootNode).render(<App />)
```
(줄 번호: Title 6-9, Counter 11-21, onClick 18, App 23-31, 관찰 코드 33-40, render 42)

`examples/same-result.jsx`
```jsx
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')

function Status() {
  const [clicks, setClicks] = useState(0)
  console.log('Status 렌더: clicks ' + clicks)
  return (
    <main>
      <p>{clicks === 0 ? '아직 안 눌렀어요' : '눌렀어요'}</p>
      <button onClick={() => setClicks(clicks + 1)}>누르기</button>
    </main>
  )
}

// 관찰용 코드(React 기능 아님): #root 안의 DOM이 바뀌면 바뀐 요소의 이름을 찍습니다.
new MutationObserver((records) => {
  const changed = records.map((r) => {
    const node = r.target.nodeType === Node.TEXT_NODE ? r.target.parentNode : r.target
    return node.id ? '#' + node.id : node.nodeName.toLowerCase()
  })
  console.log('DOM 변경: ' + JSON.stringify([...new Set(changed)]))
}).observe(rootNode, { childList: true, subtree: true, characterData: true })

createRoot(rootNode).render(<Status />)
```
(줄 번호: Status 6-15, onClick 12, 관찰 코드 17-24, render 26)

### 2. meta·route·본문(시뮬레이터 제외)
- 대상: `meta.ts`(나머지 필드), `route.tsx`, `content.mdx`
- 현재: 없음
- 변경
  - `meta.ts`
    - `slug: 'render-and-commit'`, `title: '렌더링은 컴포넌트 함수를 호출하는 것: 트리거 → 렌더 → 커밋'`, `category: 'rendering'`, `order: 20`
    - `summary`(160자 이하): 화면이 바뀔 때 React는 트리거·렌더·커밋 세 단계를 거친다는 것, 렌더는 컴포넌트 함수 호출이고 DOM은 커밋에서 달라진 곳만 바뀐다는 것.
    - `tags`: 렌더링, 렌더, 리렌더링, 다시 렌더, 트리거, 커밋, commit, render, re-render, createRoot, root.render, useState, DOM 업데이트, 페인트
    - `goals`: ① 화면 갱신의 세 단계(트리거·렌더·커밋)를 순서대로 말할 수 있다 ② 첫 렌더와 state 업데이트 때 React가 어떤 컴포넌트를 호출하는지 설명할 수 있다 ③ 렌더와 DOM 변경을 구분하고, 다시 렌더해도 DOM이 바뀌지 않을 수 있음을 설명할 수 있다
    - `prerequisites: [{ label: 'JSX는 함수 호출이다', slug: 'jsx-to-element' }]`
    - `jsPrerequisites: [{ label: '함수 호출', slug: 'function-calls' }, { label: 'DOM 노드 종류(nodeType·nodeName)', slug: 'dom-tree-nodes', anchor: '노드-종류와-nodetype-nodename' }]`
    - `related: ['jsx-to-element']`
    - `simplifications`(빠짐없이):
      1. 예제는 StrictMode 없이 렌더한다. StrictMode에서는 개발 빌드가 컴포넌트를 두 번 호출해 렌더 로그가 두 번 찍힌다. 이유는 "순수 함수와 StrictMode" 개념에서 다룬다.
      2. 관찰 코드는 DOM이 바뀐 요소의 이름만 중복 없이 찍는다. React가 어떤 DOM 연산을 몇 번 하는지는 react.dev가 정하지 않으며 이 페이지도 다루지 않는다. MutationObserver 콜백은 DOM이 바뀐 시점이 아니라 그 뒤에 불린다.
      3. 렌더 중에 DOM을 읽는 코드는 관찰용이다. 실제 컴포넌트는 렌더 중에 DOM을 읽거나 바꾸지 않는다(이유는 "순수 함수와 StrictMode" 개념).
      4. `root.render` 호출 뒤 정확히 언제 렌더가 시작되는지는 다루지 않는다. react.dev가 보장하는 것은 호출 자체가 동기가 아니라는 것뿐이다. state 업데이트가 렌더를 일으키는 시점도 마찬가지다.
      5. 예제 2의 Counter는 자식 컴포넌트가 없다. 다시 렌더되는 컴포넌트 안의 자식 컴포넌트도 렌더되는 동작은 "리렌더링은 언제 일어나나" 개념, 여러 setState를 한 번에 처리하는 동작은 "배칭과 함수형 업데이트" 개념, 커밋 뒤 effect 실행은 "useEffect 실행 시점과 cleanup" 개념에서 다룬다.
      6. 시뮬레이터의 단계 표시·호출 목록·DOM 줄 목록은 교육용 그림이며 React 내부 자료구조가 아니다. 커밋은 한 단계로 묶었고, DOM은 태그 이름과 텍스트만 요약한다. 호출 목록은 이번 렌더에서 호출한 컴포넌트와 그 컴포넌트가 돌려준 JSX 요약만 보인다.
      7. 브라우저 페인트는 react.dev 설명으로만 다루며 예제로 관찰하지 않는다.
    - `references`: react.dev Render and Commit(`https://react.dev/learn/render-and-commit`), createRoot `root.render`(`https://react.dev/reference/react-dom/client/createRoot#root-render`), useState set 함수(`https://react.dev/reference/react/useState#setstate`), 관찰 코드용 MDN MutationObserver(`https://developer.mozilla.org/ko/docs/Web/API/MutationObserver`). 작업 중 링크를 열어 앵커가 있는지 확인한다(없으면 앵커 없이 문서 URL).
    - `reviewedAt: null`
  - `route.tsx`: `app/concepts/jsx-to-element/route.tsx`와 같은 내용.
  - `content.mdx`(시뮬레이터 import·배치는 작업 3에서 추가)
    - 첫 문단: 이 글이 버튼 클릭 같은 일 뒤에 화면이 바뀌기까지를 트리거·렌더·커밋으로 나눠 실행 결과로 확인한다는 소개. `<JsLink>` 없음.
    - 둘째 문단: 컴포넌트는 함수라는 전제로 `<JsLink slug="function-calls">함수 호출</JsLink>`, 관찰 코드의 노드 종류는 `<JsLink slug="dom-tree-nodes" anchor="노드-종류와-nodetype-nodename">DOM 노드 종류</JsLink>`.
    - `## 동작 원리`: 트리거(첫 렌더, state 업데이트, `root.render`는 동기가 아님) → 렌더(React가 컴포넌트를 호출, 첫 렌더는 루트부터 재귀, 다시 렌더는 state를 바꾼 컴포넌트, 렌더 중에는 DOM을 바꾸지 않음) → 커밋(첫 렌더는 만든 노드를 붙임, 다시 렌더는 달라진 노드만, 결과가 같으면 바뀌지 않음) → 그 뒤 브라우저 페인트(용어 구분). 이어서 `<Callout type="note" title="예제의 관찰용 코드">`: MutationObserver의 역할과 호출 시점, 렌더 중 DOM 읽기는 관찰용이라는 점.
    - `## 예제`
      - `### 예제 1: 첫 렌더` + 코드 + `PredictQuiz`("출력의 첫 줄은?", 정답 `render 호출 직후, #root 자식 수: 0`, 오답: App 렌더 줄, DOM 변경 줄, Title 렌더 줄) + 출력 해설(직후 로그가 먼저, 렌더 중 #root 비어 있음, App → Title → Count 순서, 커밋에서 #root에 한 번).
      - `### 예제 2: state 업데이트로 다시 렌더` + 코드 + `PredictQuiz`("버튼을 누른 뒤 새로 찍히는 렌더 줄은?", 정답 Counter만, 오답: App·Title·Counter 모두 / App과 Counter / 없음) + 해설(App·Title 호출 없음, 렌더 중 화면 0, 커밋에서 output만).
      - `### 시뮬레이터로 확인하기`(작업 3)
      - `### 예제 3: 다시 렌더했지만 결과가 같을 때` + 코드 + `PredictQuiz`("두 번째 클릭 뒤 DOM 변경 줄은?", 정답 "찍히지 않는다", 오답 `["p"]`, `["#root"]`, `["p","button"]`) + 해설.
    - `## 결과와 이유`: 요약 문단 + JSX `<table>`(열: 단계 / 무엇이 일어나나 / 확인한 출력 / 예제. 행: 트리거(첫 렌더), 트리거(state 업데이트), 렌더, 커밋, 결과가 같은 다시 렌더) + `<Callout type="misconception" title="다시 렌더하면 화면 전체를 다시 그린다">`(예제 2·3 출력 근거).
- 이유: 페이지 본문과 메타.
- 주의사항: react.dev 문장을 옮기지 않고 직접 쓴다. 본문 주장은 2절 근거와 예제 출력만 쓴다. 내부 용어(Fiber, work loop, lane)를 쓰지 않는다. JS 사이트 URL을 직접 쓰지 않는다.
- 완료 조건: `npx vitest run tests/content-integrity.test.ts` 통과(필수 h2, JS 링크 앵커, prerequisites·related slug, summary 길이), `npm run typecheck`·`npm run lint` 통과.

### 3. 시뮬레이터
- 대상: `scenarios.ts`, `RenderCommitView.tsx`, `Simulator.tsx`, `content.mdx`(import와 배치), `concept.test.ts`, `Simulator.test.tsx`, `RenderCommitView.test.tsx`
- 현재: 없음
- 변경
  - `scenarios.ts`: 3절 상태 타입, 예제를 `?raw`로 import. 시나리오 2개(각 단계의 `output`은 그 시점까지 누적된 출력).
    - `state-update`(label "state 업데이트", exampleId `state-update`, 10단계): ① 실행 전(idle, dom null) ② 관찰 코드 등록(line 33-40, idle) ③ 트리거: `root.render(<App />)`(line 42, trigger, rendered []) ④ 렌더: App(line 23-31, rendered [App → `<main><Title /><Counter /></main>`]) ⑤ 렌더: Title(line 6-9) ⑥ 렌더: Counter(line 11-21, returns `<output>0</output> <button>+1</button>`, dom 아직 null) ⑦ 커밋: #root에 붙음(line 없음, dom 4줄 `<main>`·`<h1> 카운터`·`<output> 0`·`<button> +1` 모두 changed, 출력 `DOM 변경: ["#root"]`) ⑧ 트리거: 클릭 → `setCount(count + 1) → count 1`(line 18, rendered [], dom changed 모두 false) ⑨ 렌더: Counter만(line 11-21, returns `<output>1</output> …`, dom의 output은 아직 `0`) ⑩ 커밋: output만 바뀜(dom `<output> 1`만 changed, 출력 `DOM 변경: ["output"]`)
    - `same-result`(label "결과가 같은 다시 렌더", exampleId `same-result`, 11단계): ① 실행 전 ② 관찰 코드 등록(17-24) ③ 트리거 `root.render(<Status />)`(26) ④ 렌더 Status clicks 0(6-15) ⑤ 커밋 #root(dom `<main>`·`<p> 아직 안 눌렀어요`·`<button> 누르기` 모두 changed) ⑥ 트리거 클릭 1(12) ⑦ 렌더 Status clicks 1 ⑧ 커밋 p만 changed(`<p> 눌렀어요`) ⑨ 트리거 클릭 2(12) ⑩ 렌더 Status clicks 2(returns가 ⑦과 같음) ⑪ 커밋: 바뀐 DOM 없음(dom 그대로, changed 모두 false, 출력 추가 없음)
  - `RenderCommitView.tsx`: 3절 네 영역. 영역마다 `section aria-labelledby`(첫 개념 `Area` 패턴). 빈 상태 문구: 트리거 없음 "없음", 호출 목록 비어 있음 "이번 렌더에서 호출한 컴포넌트 없음", dom null "비어 있음". 바뀐 줄은 "바뀜" 텍스트 배지와 `data-changed="true"`. 들여쓰기는 `depth`에 따른 padding. 긴 텍스트는 `break-words`.
  - `Simulator.tsx`: `label="렌더와 커밋 시뮬레이터"`, `renderState={(state) => <RenderCommitView state={state} />}`.
  - `content.mdx`: 맨 위 `import { Simulator } from './Simulator'`, `import { scenarios } from './scenarios'`. 예제 2 뒤 `### 시뮬레이터로 확인하기` 소개 한 문단과 독립된 줄의 `<Simulator scenarios={scenarios} />`.
  - `concept.test.ts`: 시나리오마다 `assertScenarioInvariants`. 구성(id·exampleId·단계 수 10·11), 첫 단계 line 없음·output 빈 배열, `trigger` 단계는 `rendered`가 빈 배열, `changed: true`는 `commit` 단계에만 있음, `dom`은 첫 커밋 전까지 null, state-update ⑨의 `rendered` 이름이 `['Counter']`이고 dom의 output 줄이 `<output> 0`, same-result 마지막 단계는 changed가 없고 output이 앞 단계와 같음.
  - `Simulator.test.tsx`: 첫 단계 표시, 시나리오 전환 시 1단계, 각 시나리오 마지막 단계 콘솔 출력 = `expectedOutput`, 키보드 →/←/Home(첫 개념 테스트 패턴).
  - `RenderCommitView.test.tsx`: 빈 상태 문구, 커밋 단계에서 "바뀜" 배지 개수(state-update ⑦ 4개, ⑩ 1개), 현재 단계 표시 텍스트.
- 이유: 단계별로 "렌더 중 DOM은 그대로, 커밋에서 달라진 곳만"을 보이는 핵심 시각화.
- 주의사항: Step의 state는 전체 스냅샷이다(차분 아님). 첫 단계는 JS 없이 프리렌더된다. 색만으로 구분하지 않는다.
- 완료 조건: `npx vitest run app/concepts/render-and-commit` 통과. 음성 확인: state-update ⑨의 dom output 줄을 `<output> 1`로 바꾸면 `concept.test.ts`가 실패하고, 되돌리면 통과한다.

### 4. 로드맵 갱신
- 대상: `.claude/plans/concept-roadmap.md`
- 변경: 상태 줄에 "2번 작성 2026-11-12" 추가, 2번 행 JS 연결을 `확정: \`function-calls\`, \`dom-tree-nodes\``로.
- 완료 조건: 2번 행이 meta의 `jsPrerequisites`와 같다.

### 5. e2e 케이스 추가
- 대상: `tests/e2e/helpers.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/responsive.spec.ts`
- 변경: 4절대로 상수와 케이스를 추가한다. a11y는 light/dark 블록 안에 첫 개념 케이스(`a11y.spec.ts:56-72`)와 같은 방식으로 두 시나리오(라디오 이름 "state 업데이트", "결과가 같은 다시 렌더")의 모든 단계에서 axe를 돌리고 마지막에 `다음`이 `aria-disabled="true"`인지 본다(9번·10번 클릭). responsive는 경로 가로 스크롤 1건과 시뮬레이터 진행 1건.
- 주의사항: 기존 케이스·상수를 고치지 않는다. 테스트 이름에 `render-and-commit`을 넣는다.
- 완료 조건: `git diff tests/e2e`에 `-`로 시작하는 변경 줄 없음(파일 헤더 제외). `npx playwright test -g "render-and-commit" --list`에 추가한 케이스가 나온다(a11y light·dark 각 1, responsive 2, 프로젝트 수만큼).

### 6. 전체 검증
- 6절 명령을 순서대로 실행한다. 새 폴더를 만들었으므로 dev 서버를 재시작한 뒤 6절 브라우저 시나리오를 확인한다.
- 완료 조건: 모든 명령 통과, 빌드 HTML grep 0건, 브라우저 시나리오 1~4의 관찰값이 6절과 같다.

### 7. L7 자체 점검
- content-guide L7 체크리스트를 항목별로 확인하고 결과를 "구현 진행"에 적는다. 특히 react.dev 링크 3개와 MDN 링크를 실제로 열어 확인하고, 본문 문장마다 근거(2절 문서 문장 또는 예제 출력)가 있는지 대조한다.
- 완료 조건: 체크리스트 10항목에 결과가 기록되어 있다.

## 9. 추가 개선 후보
- `jsx-to-element`의 simplifications 5번("렌더링은 컴포넌트 함수를 호출하는 것" 개념에서 다룬다)과 `related`를 이 개념으로 연결. 첫 개념 본문 변경이라 다시 검토가 필요하다(content-guide 10단계). 이번 범위에서 제외.

## 변경 이력
- 2026-11-12 (리뷰 지적 Low, 사용자 요청): 렌더 단계 문구 "DOM을 바꾸지 않는다"를 "화면의 DOM(#root 안)을 바꾸지 않는다"로 좁힘(content.mdx 4곳, scenarios.ts 설명 2곳). react.dev가 첫 렌더 중 DOM 노드를 만든다고도 쓰기 때문 — 영향 단계 2, 3
- 2026-11-12 (사용자 검토 의견 7건): ① 커밋 비교 대상을 "이전 렌더 결과"로 통일(시나리오 state-update 10·same-result 8단계) ② 다시 렌더에도 재귀 호출을 명시하고 예제 2의 Counter는 자식이 없어 Counter만 호출된다고 한정(동작 원리, 예제 2 해설·퀴즈, 시나리오 9단계) ③ 다시 렌더 대상을 "그 state를 가진 컴포넌트"로 통일 ④ "결과가 같다"를 "DOM에 반영할 차이가 없다"로 좁힘(JSX는 새 onClick 함수 등으로 매번 다름). 같은 이유로 예제 3 제목·시나리오 2 label·결과 표 행 이름도 바꿈(e2e 라디오 이름 함께 수정) ⑤ simplifications에 같은 값 set(Object.is, useState Caveats 확인) 추가 ⑥ root.render 비동기 문장에 createRoot·flushSync 조건 추가(createRoot Caveats 확인) ⑦ 트리거를 "이 글에서 다루는 두 가지"로, 첫 렌더를 "root에 render를 처음 호출"로 바꾸고 같은 root 재호출은 갱신이라는 점을 simplifications에 추가 — 영향 단계 2, 3, 5
- 2026-11-12 (사용자 검토 의견 2차 1건): 예제 2에서 "Counter만 호출된 이유(자식 없음)"와 "App·Title이 호출되지 않은 이유(Counter가 돌려준 JSX 안에 없음)"를 나눠 씀(content.mdx 퀴즈 해설·본문, scenarios.ts 9단계) — 영향 단계 2, 3

## 구현 진행

- baseline (2026-11-12, `6764ca3` + JS 인덱스·로드맵·이 계획 문서): lint·format:check·typecheck 통과 / vitest 21 files·141 통과 / test:build 26 통과 / e2e는 작업 6에서 범위 실행
- [x] 1. 예제 3개와 출력 — 예제는 scratchpad 시제품(jsdom·Chromium 확인)을 그대로 복사. vitest react-examples 12 통과(개념 예제 3 포함), 기대값 = 2절 출력. 음성: same-result 기대값에 `DOM 변경: ["p"]` 추가 시 same-result 1 failed, 원복 후 통과
- [x] 2. meta·route·본문 — content-integrity·react-examples 49 통과. references 4개 HTTP 200·앵커(`root-render`, `setstate`) 확인(서브에이전트 curl). 메인 검토로 본문 수정: `root.render`를 "동기적으로 끝나지 않는다"에서 "호출한 그 자리에서 렌더하지 않는다"로(3곳, createRoot Caveat 표현에 맞춤), 예제 3 해설의 독자용이 아닌 "실행기" 문장 삭제
- [x] 3. 시뮬레이터 — scenarios(10·11단계)·RenderCommitView·Simulator·테스트 3파일, vitest 22 통과. 음성: state-update 9단계 dom을 `<output> 1`로 바꾸면 concept.test 1 failed, 원복 후 통과(메인 재실행). 메인 검토로 첫 커밋 설명 2곳 수정: "커밋에서 처음으로 DOM이 만들어져"는 react.dev(첫 렌더 중 DOM 노드를 만들고 커밋에서 붙임)와 어긋나 "렌더 결과의 DOM 노드가 #root에 붙어 화면에 나타납니다"로. content.mdx에 시뮬레이터 import·섹션 추가(메인). 서브에이전트 판단: 커밋 단계도 그 렌더의 호출 목록을 유지, `<main>`을 depth 0으로(simplifications 6번 범위 안)
- [x] 4. 로드맵 갱신 — 상태 줄 "2번 작성 2026-11-12", 2번 행 `확정: function-calls, dom-tree-nodes`
- [x] 5. e2e 케이스 추가(정적 확인) — `git diff tests/e2e` 삭제 줄은 한 줄 import 2개(여러 줄로 확장)뿐, 기존 케이스 변경 없음. 실행은 작업 6
- [x] 6. 전체 검증 — 메인 실행: lint·format:check·typecheck 통과, vitest 24 files·182 통과, test:build 31 통과, `<code>` 공백 grep 0·`**` 0. 빌드 HTML에서 note Callout의 "읽습니다(" 뒤 줄바꿈 공백("( rootNode…")을 발견해 괄호 없는 문장으로 수정 후 재빌드 확인. e2e: navigation+react-examples 26 passed·10 skipped(모바일 skip, Chromium 예제 3개 포함), `-g render-and-commit` 11 passed·3 skipped. 브라우저(dev 8888): 시나리오 1은 1~6단계 `#root` 비어 있음, 7단계 바뀜 4, 9단계 호출 Counter·output 0, 10단계 output 1만 바뀜. 시나리오 2 마지막 단계 바뀜 0. 단계 표시는 트리거/렌더/커밋 단계에서 각각 "현재". 375px·다크에서 가로 넘침 0(스크린샷 확인)
- [x] 7. L7 자체 점검 — ① 8요소: 소개·목표(meta)·선행·원리·예제 3·시뮬레이터·단계 설명·결과 표·관련 링크 있음 ② 근거 링크: react.dev 3개(Render and Commit·createRoot·useState) 200·앵커 확인, MDN은 관찰 코드 참고용 ③ 내부 구현 용어 없음 ④ React 18 차이 없음(로드맵 "-"), Callout 없음 ⑤ JS 링크 `function-calls`, `dom-tree-nodes#노드-종류와-nodetype-nodename` 인덱스에 존재, 문구가 대상과 맞음 ⑥ 원인은 react.dev 문장(createRoot Caveat, 다시 렌더 대상, 달라진 노드만 변경)으로 설명 ⑦ DOM 연산 개수·종류, 렌더 시작 시점은 쓰지 않고 simplifications 2·4에 명시 ⑧ simplifications 7개가 StrictMode·관찰 코드·렌더 중 DOM 읽기·시점·자식 렌더/배칭/effect·시뮬레이터 그림·페인트를 덮음 ⑨ jsdom·Chromium 실행 검증 ⑩ 375px·다크 확인
- 리뷰 1차(critical-code-review, 메인 직접): Critical 0 · High 0 · Medium 0 · Low 2(보고만)
  - Low: `app/concepts/render-and-commit/content.mdx` 동작 원리 2번·결과 표 "렌더" 행의 "DOM을 바꾸지 않습니다"는 react.dev 틀(렌더는 계산, 커밋에서 DOM 변경)과 맞지만, react.dev는 첫 렌더 중 DOM 노드를 "만든다"고도 쓴다. "화면의 DOM(#root 안)을 바꾸지 않는다"로 좁히면 더 정확하다
  - Low: `app/concepts/render-and-commit/concept.test.ts` "두 번째 렌더가 돌려준 JSX는 첫 번째 클릭 뒤와 같다"는 `statusCall2 = { ...statusCall1 }`이라 항상 참이다(상태 데이터의 의도를 기록하는 정도)
  - 문제없음 확인: 본문·시나리오 문장의 근거(createRoot Caveat, 다시 렌더 대상, 달라진 노드만 변경), 하이드레이션(첫 렌더가 프리렌더 값만 씀), 단계 표시 접근성(`aria-current="step"` + "현재" 텍스트), e2e 기존 케이스 무변경, 예제 원문 = 계획 8절, 공통 코드 무변경
- [x] Low 반영(사용자 요청 2026-11-12) — 위 변경 이력. 메인 재실행: lint·format:check·typecheck 통과, vitest 182, test:build 31, 빌드 HTML에 새 문구 4개 확인·`<code>` 공백 0·`**` 0. 문구만 바뀌고 마크업·예제·시나리오 상태는 그대로라 e2e는 재실행하지 않음. 재리뷰(수정 범위): Critical·High 0, 남은 Low는 concept.test의 항상 참인 검사 1건
- [x] 사용자 검토 의견 7건 반영(2026-11-12, 변경 이력) — 근거 재확인: useState Caveats(Object.is 같은 값이면 건너뜀, 건너뛰기 전 호출 가능), createRoot Caveats(flushSync로 첫 렌더 동기, 같은 root 재호출은 DOM 갱신). 메인 판단: 같은 값 set은 react.dev troubleshooting이 객체 직접 변경과 묶어 설명하므로 로드맵 7번 "객체·배열 state"로 연결(검토안은 8번). "React 18 이상" 표기는 사이트 기준이 19.3.1이고 근거를 다시 확인하지 않아 넣지 않음. 1번 개념과의 교차 확인: 1번은 "React가 렌더할 때 호출"만 쓰고 즉시 호출을 주장하지 않아 모순 없음. 메인 재실행: lint·format:check·typecheck 통과, vitest 182, test:build 31, 빌드 HTML 새 문구 확인·`<code>` 공백 0·`**` 0, e2e navigation+react-examples 26 passed·10 skipped, `-g render-and-commit` 11 passed·3 skipped. 재리뷰(수정 범위): Critical·High 0
- [x] 2차 검토 의견 반영 — 메인 재실행: lint·format:check·typecheck 통과, vitest 182, test:build 31, 빌드 HTML 새 문구 2곳·`<code>` 공백 0·`**` 0. 문구만 바뀌어 e2e 재실행 안 함. StrictMode 로그 버전 범위는 사이트 기준(19.3.1)상 문장 유지
- 마무리(2026-11-12, 사용자 최종 승인): content-guide 10단계에 따라 `meta.reviewedAt: '2026-11-12'`. 메인 재실행: vitest 182, test:build 31(sitemap `lastmod 2026-11-12`, "검토 중" 배지 0). content-guide 4절에 "JSX 컴포넌트 안 여는 괄호 뒤 줄바꿈 공백" 주의 한 줄 추가

## 구현 결과

### 계획 대비 실제 구현
- 작업 순서 1~7을 계획대로 구현했다. 달라진 점:
  - 사용자 검토 의견을 두 차례 반영해 본문·시나리오 문장을 고쳤다(변경 이력). 커밋 비교 대상을 "이전 렌더 결과"로 통일했고, 다시 렌더할 때의 재귀 호출과 그 이유(App·Title은 Counter가 돌려준 JSX 밖)를 명시했다. "결과가 같다"는 "DOM에 반영할 차이가 없다"로 바꿨고, 같은 값 set과 같은 root 재호출을 simplifications에 추가했으며, root.render에 createRoot·flushSync 조건을 붙였다.
  - 위 수정에 따라 예제 3 제목과 시나리오 2 label을 바꿨다("DOM 변경 없는 다시 렌더"). e2e 라디오 이름도 같이 바꿨다.
  - 리뷰 Low를 반영해 렌더 단계 문구를 "화면의 DOM"으로 좁혔다.
  - 메인 검토로 고친 것이 세 가지다. createRoot 표현, 첫 커밋 설명(DOM 노드는 렌더 중 만들고 커밋에서 붙임), Callout 괄호 공백.

### 코드 리뷰
- Critical·High 0건이다. Low 1건(렌더 단계 문구)은 사용자 요청으로 고쳤다. Low 1건(`concept.test.ts`의 항상 참인 JSX 요약 비교)은 남겼다.

### 후속 작업
- [ ] `jsx-to-element`의 simplifications 5번과 `related`를 `render-and-commit`으로 연결. 1번 본문을 바꾸므로 다시 검토가 필요하다
- [ ] 로드맵 3번 "순수 함수와 StrictMode" 작성(이 페이지가 렌더 중 DOM 읽기와 StrictMode 이중 호출을 그 개념으로 넘김)
- [ ] 로드맵 7번 "객체·배열 state" 작성 시 같은 값 set(Object.is) 동작을 다룬다(이 페이지 simplifications가 그 개념을 가리킴)

### 이해 확인

#### 설명할 수 있어야 하는 기술적 판단
- [Claude 판단] 같은 값으로 set하는 경우를 로드맵 7번 "객체·배열 state" 개념으로 넘겼다. 검토안은 8번 "리렌더링은 언제 일어나나"였다. react.dev useState troubleshooting이 같은 값 무시를 객체 직접 변경과 묶어 설명하기 때문이다. 같은 이유로 근거를 다시 확인하지 않은 "(React 18 이상)" 표기는 넣지 않았다.
- [무검토 승인] "렌더 중 화면의 DOM은 그대로"를 MutationObserver 출력 순서가 아니라 렌더 중 DOM을 직접 읽어 보였다(`#root 자식 수: 0`, `화면 0`). 콜백은 DOM이 바뀐 뒤 나중에 불리므로 출력 순서만으로는 시점을 증명할 수 없다. 대신 관찰용 코드라는 안내를 주석과 Callout에 넣었다.
- [무검토 승인] 관찰 코드는 바뀐 요소 이름만 중복 없이 찍는다. 레코드 종류(childList, characterData)와 개수는 react.dev가 정하지 않는 구현 세부라서 출력하지 않았다(19.3.1 시제품에서는 첫 커밋 `#root childList`, 텍스트 변경 `output characterData`).
- [무검토 승인] 예제 2의 Counter에 자식 컴포넌트를 두지 않았다. "부모가 렌더되면 자식도"(8번)를 앞당기지 않기 위해서다. 대신 본문에 재귀 규칙을 쓰고 Counter만 호출된 이유를 한정했다(사용자 검토로 보강).
- [무검토 승인] 시뮬레이터는 렌더 결과 전체 트리를 그리지 않고, 이번 렌더에서 호출한 컴포넌트와 그 반환 JSX 요약만 보인다. 다시 렌더 때 호출되지 않은 컴포넌트의 결과를 어떻게 그릴지 새 가정이 필요하기 때문이다.
- 커밋 관찰 방법은 사용자가 MutationObserver로 골랐다. 버린 대안은 DOM 노드 동일성 비교와 문서 근거만 쓰는 방식이다.
- 커밋의 비교 대상을 "이전 렌더 결과"로 통일하고, "결과가 같다"를 "DOM에 반영할 차이가 없다"로 좁힌 것은 사용자 검토 의견으로 고쳤다.

#### 배경지식
- createRoot의 `root.render(...)`는 동기가 아니다. 다음 줄에서는 아직 렌더 결과가 없고, `flushSync`로 감싸면 첫 렌더를 동기로 실행할 수 있다(react.dev createRoot Caveats).
- 다시 렌더할 때 React는 그 state를 가진 컴포넌트를 호출하고, 그 컴포넌트가 돌려준 JSX 안의 컴포넌트를 이어서 호출한다. 부모와 형제는 그 JSX 밖이라 호출되지 않는다(react.dev Render and Commit, 예제 2 출력).
- 커밋은 이전 렌더와 달라진 DOM 노드만 바꾼다. 돌려준 JSX는 렌더마다 새 핸들러 함수 등으로 달라도, DOM에 반영할 차이가 없으면 DOM은 바뀌지 않는다(예제 3 출력).
- MutationObserver 콜백은 DOM이 바뀐 뒤에 모아서 불린다. 이 사이트의 예제 실행기는 클릭 뒤 출력이 더 늘지 않는지 확인하므로, `DOM 변경` 줄이 없는 것도 관찰 결과가 된다.
- set 함수에 `Object.is`로 같은 값을 넘기면 React는 다시 렌더를 건너뛴다. 건너뛰기 전에 컴포넌트를 한 번 호출할 수는 있다(react.dev useState Caveats).

#### 확인 질문
1. 렌더 중에 DOM이 아직 그대로라는 것을, `DOM 변경` 줄이 렌더 로그보다 뒤에 찍힌다는 사실만으로 보일 수 없는 이유는?
   <details><summary>답</summary>MutationObserver 콜백은 DOM이 바뀐 순간이 아니라 그 뒤에 모아서 불린다. 그래서 출력 순서는 변경 시점을 증명하지 못한다. 그래서 렌더 중에 DOM을 직접 읽어 `#root 자식 수: 0`, `화면 0`을 보였다(3절 구현 전략, meta simplifications 2·3).</details>
2. 관찰 코드가 레코드 종류(`characterData` 등)까지 출력했다면 무엇이 문제인가?
   <details><summary>답</summary>React가 텍스트를 어떤 DOM 연산으로 바꾸는지는 react.dev가 정하지 않는 구현 세부라서 버전에 따라 달라질 수 있다. 그러면 페이지가 보장되지 않는 동작을 결과로 주장하게 된다. 요소 이름만 중복 없이 찍으면 "어디가 바뀌었나"라는 공개 동작만 남는다(2절 시제품 실행, simplifications 2).</details>
3. 예제 2의 Counter가 자식 컴포넌트 `<Badge />`를 돌려줬다면 클릭 뒤 어떤 컴포넌트가 호출되는가? App과 Title은?
   <details><summary>답</summary>Counter, 이어서 Badge가 호출된다. Counter가 돌려준 JSX 안에 있기 때문이다. App과 Title은 Counter의 부모와 형제라서 그 JSX 밖이므로 호출되지 않는다. 근거는 react.dev Render and Commit의 재귀 설명이며, 이 구성은 실행으로 검증하지 않았다(content.mdx 동작 원리 2, 변경 이력 2차).</details>
4. 예제 3의 두 번째 클릭 뒤 "돌려준 JSX가 이전과 같아서 DOM이 안 바뀌었다"고 설명하면 왜 부정확한가?
   <details><summary>답</summary>`onClick={() => setClicks(clicks + 1)}`은 렌더마다 새 함수이고 `clicks` 값도 다르므로 JSX는 매번 다르다. 같은 것은 DOM에 반영되는 p의 글뿐이다. 그래서 "DOM에 반영할 차이가 없다"고 쓴다(변경 이력 ④, simplifications 6).</details>
5. 예제 3에서 클릭할 때 `setClicks(clicks)`처럼 같은 값을 넘겼다면 출력은 어떻게 달라질 수 있고, 이 페이지는 왜 그것을 다루지 않는가?
   <details><summary>답</summary>`Object.is`로 같은 값이면 React는 다시 렌더를 건너뛰므로 보통 `Status 렌더` 줄이 찍히지 않는다. 다만 건너뛰기 전에 한 번 호출될 수는 있다(useState Caveats). 이 페이지는 값을 바꾸는 업데이트만 다루고, 같은 값 처리는 객체 직접 변경과 함께 로드맵 7번에서 다룬다([Claude 판단], simplifications).</details>

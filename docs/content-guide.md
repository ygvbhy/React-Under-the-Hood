# 콘텐츠 작성 가이드

새 개념 페이지를 추가하는 절차, 작성 규칙, 사람 검토 체크리스트입니다. 이 절차만 따르면 `app/routes.ts`, `app/lib/`, `tests/` 같은 공통 코드를 고치지 않고 개념을 추가할 수 있습니다. 프로젝트 전체 규칙은 [AGENTS.md](../AGENTS.md)를 보세요. 아직 개념 페이지가 없으므로, 첫 개념이 만들어지면 그 폴더가 가장 먼저 읽을 참고 구현이 됩니다. 쓸 개념과 순서는 [.claude/plans/concept-roadmap.md](../.claude/plans/concept-roadmap.md)를 따릅니다.

## 새 개념 추가 절차

### 1. 폴더 만들기

`app/concepts/<slug>/` 폴더를 만듭니다. slug는 kebab-case 영문 소문자(예: `state-snapshot`, `key-and-identity`)이며 폴더명이 곧 URL(`/concepts/<slug>`)입니다. 한 번 공개한 slug는 바꾸지 않습니다.

```
app/concepts/<slug>/
  meta.ts
  content.mdx
  route.tsx
  examples/*.jsx
  (선택) scenarios.ts, Simulator.tsx, 시각화 컴포넌트, concept.test.ts
```

### 2. `meta.ts` 작성

메타데이터는 순수 데이터입니다. `import type { ConceptMeta } from '~/lib/concepts'` 외에는 아무것도 import하지 않습니다(홈 화면 번들에 본문이나 시뮬레이터가 딸려오지 않게 하기 위해서입니다). `export const concept = { ... } satisfies ConceptMeta` 형태로 씁니다.

| 필드              | 작성 방법                                                                                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `slug`            | 폴더명과 같게 씁니다(테스트가 검사).                                                                                                                                                                                                                                                                   |
| `title`           | 페이지 제목이자 홈 카드 제목입니다. 이 페이지가 설명하는 질문이나 구분을 담습니다.                                                                                                                                                                                                                     |
| `summary`         | 홈 카드와 `<meta name="description">`에 쓰입니다. 160자 이하(테스트가 검사).                                                                                                                                                                                                                           |
| `category`        | `rendering`(렌더링 기초), `state`(state와 업데이트), `effects`(이벤트·ref·effect), `optimization`(메모이제이션과 Context), `internals`(내부 구현), `concurrency`(동시성) 중 하나. 홈에서 이 그룹으로 묶이며, 그룹 순서는 이 나열 순서입니다. 개념별 카테고리는 로드맵에 있습니다.                      |
| `order`           | 학습 순서입니다. 홈의 학습 순서 보기와 개념 페이지 이전/다음 링크에 쓰입니다. 로드맵의 제안값(번호 × 10)을 쓰고, 선수 개념(`prerequisites`의 `slug`)보다 큰 번호를 줍니다. 사이에 끼울 때는 사이 번호(예: 205)를 씁니다. 화면에는 순위(1부터)로 보입니다. 테스트가 중복과 선수 개념 조건을 검사합니다. |
| `tags`            | 검색에 쓰이는 키워드 배열입니다. 제목·요약에 없는 동의어도 넣습니다.                                                                                                                                                                                                                                   |
| `goals`           | "~할 수 있다"로 끝나는 학습 목표를 1개 이상 씁니다.                                                                                                                                                                                                                                                    |
| `prerequisites`   | `{ label, slug? }[]`. 이 사이트에 이미 있는 개념이면 `slug`를 줘서 링크로 만들고(없는 slug나 자기 자신이면 테스트 실패), 아직 없는 개념은 `label`만 씁니다.                                                                                                                                            |
| `jsPrerequisites` | `{ label, slug, anchor? }[]`. 선행으로 필요한 자바스크립트 개념을 JS Under the Hood 페이지로 연결합니다. 필수 필드이며 없으면 `[]`입니다. `slug`와 `anchor`는 `app/lib/js-site-index.json`에 있어야 합니다(테스트가 검사). 추가·수정하기 전에 `npm run js-index:sync`를 실행합니다.                    |
| `related`         | 이 사이트에 존재하는 다른 개념의 slug 배열입니다. 없으면 `[]`. 자기 자신이나 없는 slug는 테스트가 실패합니다.                                                                                                                                                                                          |
| `examples`        | `{ id, file, runtime: 'react-dom', interactions?, expectedOutput }[]`. `file`은 `.jsx`로 끝나야 합니다. `interactions`는 `{ type: 'click', selector }[]`이며 지금은 `click`만 지원합니다. 3단계 참고. `id`는 개념 안에서 유일해야 합니다.                                                              |
| `simplifications` | 이 페이지의 설명과 시각화가 실제 React 동작·구현과 다르게 단순화한 부분을 1개 이상 씁니다. 내부 구현 페이지에서는 19.3.1 구현 기준이며 버전마다 바뀔 수 있음을 적습니다. 단순화가 없다고 판단되면 그 사유를 한 줄로 씁니다(빈 배열 금지).                                                              |
| `references`      | `{ label, url }[]`를 1개 이상. URL은 `https://`로 시작해야 하며, react.dev의 해당 문서를 넣고 내부 구현을 다루면 `https://github.com/facebook/react/blob/v19.3.1/...` 고정 링크를 넣습니다. 링크는 실제로 열어 확인합니다.                                                                             |
| `reviewedAt`      | 처음에는 반드시 `null`(페이지에 "검토 중" 배지). 10단계에서 사용자 검토 후 `'YYYY-MM-DD'`로 바꿉니다. 이 날짜는 구조화 데이터의 `dateModified`와 sitemap의 `lastmod`로도 쓰입니다.                                                                                                                     |

### 3. 예제와 `expectedOutput`

출력 결과를 주장하는 코드는 모두 `examples/<이름>.jsx` 파일로 둡니다.

- 예제 파일은 사용자가 보는 완전한 React 프로그램입니다. `createRoot(document.getElementById('root')).render(...)`로 `#root`에 렌더하는 줄까지 포함합니다. StrictMode가 필요하면 코드에 직접 감쌉니다.
- `console.log`에는 원시 값, 불리언, `JSON.stringify(...)` 결과만 넘깁니다. 문자열에 `%`를 쓰지 않습니다(서식 지정자로 해석되어 실행기가 위반으로 기록합니다).
- 지연 타이머(`setTimeout`에 긴 지연)와 끝나지 않는 비동기 작업을 쓰지 않습니다. 실행기는 짧은 대기 후 출력이 멈췄는지로 끝을 판단합니다.
- 사용자 조작(클릭)은 예제 코드에 넣지 않습니다. `meta.examples[].interactions`에 `{ type: 'click', selector: 'button' }`처럼 적으면 실행기가 클릭하고 결과를 기다립니다.
- `console.error`/`console.warn`이 나오거나 렌더·effect·핸들러에서 예외가 나면 예제가 실패합니다(React 키 경고 같은 개발 경고도 포함).
- jsdom 테스트에서 React 모듈 상태(개발 경고의 중복 제거, 이전 root)는 같은 테스트 파일 안의 예제끼리 공유됩니다. 다른 예제의 실행에 영향받지 않게 씁니다.
- 파일 끝에 줄바꿈 하나를 둡니다. 이 폴더의 파일은 Prettier/ESLint 대상이 아니므로 줄 번호가 바뀌지 않습니다(시뮬레이터의 줄 강조가 이 번호를 씁니다).
- 예제 문장과 코드는 직접 작성합니다. 순수 자바스크립트 동작만 보이는 예제는 이 사이트에 쓰지 않고 JS 사이트로 링크합니다.

`meta.ts`의 `examples`에 등록하고, `expectedOutput`은 `console.log` 호출 하나당 한 줄(여러 인수는 공백으로 이어진 문자열)로 씁니다.

```ts
examples: [
  {
    id: 'batching',
    file: 'batching.jsx',
    runtime: 'react-dom',
    interactions: [{ type: 'click', selector: 'button' }],
    expectedOutput: ['render 0', 'clicked 0', 'render 1'],
  },
],
```

**출력을 추측해서 쓰지 마세요.** 처음에는 `expectedOutput: []`로 두고 `npm test`를 실행하면, 테스트가 실제 출력과의 차이를 보여 줍니다. 그 실제 출력이 내가 설명하려던 동작과 같은지 확인한 뒤 값을 채웁니다. 실제 결과가 예상과 다르면 그 이유를 이해할 때까지 페이지를 쓰지 않습니다.

**jsdom과 Chromium 두 곳에서 검증합니다.** `npm test`는 jsdom에서, `npm run e2e`의 `react-examples.spec.ts`는 실제 Chromium에서 같은 예제와 같은 `expectedOutput`을 대조합니다. 두 결과가 다르면 `expectedOutput`을 고치지 말고 원인을 먼저 찾습니다.

### 4. `content.mdx` 작성

필수 h2가 3개 있어야 하며(테스트가 검사) 제목 문자열이 정확히 같아야 합니다.

```mdx
## 동작 원리

## 예제

## 결과와 이유
```

**`<PredictQuiz>`를 1개 이상 두는 것을 권장합니다.** 예측 → 확인이 이 사이트의 기본 학습 흐름입니다. 퀴즈를 쓰면 `npm run test:build`가 프리렌더 HTML에 JS 없이도 열람 가능한 정답(`<details`)이 있는지 검사합니다.

권장 흐름은 `동작 원리` → `예제`(코드 + 예측 퀴즈 + 시뮬레이터) → `결과와 이유`(+ 흔한 오해)입니다. 소개·학습 목표·선행 개념·단순화·참고 자료·관련 개념은 `meta.ts`에서 레이아웃이 자동으로 그리므로 본문에 다시 쓰지 않습니다.

**예제 코드 넣기.** 예제 파일을 그대로 가져오는 코드 펜스를 씁니다. 코드를 본문에 복붙하지 마세요.

````mdx
```jsx file=./examples/batching.jsx

```
````

Prettier가 이 블록 안에 빈 줄을 넣을 수 있는데, 동작에는 영향이 없으니 그대로 둡니다. 빌드 때 Shiki가 코드를 하이라이트합니다.

**쓸 수 있는 MDX 컴포넌트.** 따로 import하지 않아도 됩니다(`app/components/concept/mdx-components.tsx`).

- `<Callout type="note" | "warning" | "misconception" | "react18" title="선택">…</Callout>`: 참고 / 주의 / 흔한 오해 / React 18에서는 상자. 유형은 라벨 텍스트로도 표시됩니다. `react18`은 React 18과 달라진 점을 보일 때 씁니다. 차이는 릴리스 노트·업그레이드 가이드로 확인한 것만 씁니다.
- `<JsLink slug="closure" anchor="호출마다-새-환경">클로저</JsLink>`: JS Under the Hood 페이지(선택적으로 제목 앵커)로 가는 외부 링크. `anchor`는 생략할 수 있고, 쓰려면 `slug` 다음에 둡니다(속성 순서 고정). 본문에서 JS 사이트로 가는 링크는 이 컴포넌트만 씁니다. 마크다운 링크나 URL로 직접 쓰면 테스트가 실패합니다.
- `<PredictQuiz question="…" choices={['…', '…']} answer={0} explanation="…" />`: 결과 예측 퀴즈. `answer`는 0부터 시작하는 정답 인덱스입니다. 프리렌더/JS 없음에서는 `<details>` 정답으로, 하이드레이션 후에는 라디오 퀴즈로 보입니다. 코드 예제 바로 뒤에 둡니다.
- `<Wide>…</Wide>`: 본문 열보다 넓게(최대 1100px) 보여 줄 블록. 넓은 표나 그림에 씁니다.

**표는 JSX `<table>`로 씁니다.** GFM 마크다운 표(`| a | b |`)는 지원하지 않습니다(`remark-gfm` 미도입). 첫 개념 페이지의 결과 표를 그대로 본떠 쓰고, 좁은 화면을 위해 `<div className="my-6 overflow-x-auto">`로 감쌉니다.

작성 시 주의:

- 시뮬레이터처럼 개념 폴더 안의 컴포넌트는 MDX 맨 위에서 직접 `import`합니다.
- 헤딩(h2, h3)에는 자동으로 앵커가 붙습니다. h1은 쓰지 않습니다(레이아웃이 제목을 그립니다).
- 미리 알 수 없는 값으로 첫 렌더를 바꾸는 코드를 넣지 않습니다([AGENTS.md](../AGENTS.md)의 하이드레이션 규칙).
- 굵게(`**…**`)의 닫는 `**` 바로 앞이 문장부호이고 바로 뒤가 한글이면 굵게 처리되지 않고 별표가 그대로 보입니다(CommonMark 규칙). 예: `**배칭(batching)**이라고` → `**배칭**(batching)이라고`. `npm run test:build`의 본문 첫 문단 검사가 첫 문단에서만 이를 잡아 줍니다.
- `<Callout>` 같은 JSX 컴포넌트 안의 글은 Prettier가 줄을 다시 나누는데, 인라인 코드(`` `setCount(c => c + 1)` ``) 한가운데서 줄이 나뉘면 다음 줄의 들여쓰기 공백이 코드에 섞여 렌더링됩니다. 공백이 들어간 인라인 코드가 줄 끝에 걸리면 `<code>{"setCount(c => c + 1)"}</code>`처럼 JSX로 씁니다. 빌드 후 `grep -o '<code>[^<]*  [^<]*</code>' build/client/concepts/<slug>/index.html`로 확인할 수 있습니다.

### 5. (선택) 시뮬레이터

단계별 시각화가 필요한 개념에만 만듭니다. 공통 부품(`app/simulator/`)이 셸과 단계 이동을 맡고, 개념마다 직접 만드는 것은 상태 타입·시나리오·시각화 컴포넌트와 얇은 `Simulator.tsx`입니다.

1. **`scenarios.ts`**: 상태 타입(예: `RenderState`)을 정의하고 `Scenario<State>[]`를 내보냅니다. 각 `Step`은 `title`, `explanation`, `line`(1부터 시작하는 `{ from, to }`, 시작·종료 단계는 생략 가능), `state`(**그 시점의 전체 스냅샷**, 차분 아님), `output`(그 단계까지 누적된 `console.log` 줄)을 가집니다. 시나리오는 `id`, `label`, `exampleId`(`meta.examples[].id`), `code`, `steps`(2개 이상)를 가집니다.
2. 코드는 예제 파일 원문을 `import code from './examples/x.jsx?raw'`로 가져와 `code`에 넣습니다(복붙하면 불변식 테스트가 실패).
3. **시각화 컴포넌트**: 한 단계의 `state`를 받아 그립니다. 색만으로 구분하지 말고 텍스트도 함께 둡니다. 좁은 화면(375px)에서 가로로 넘치지 않게 합니다.
4. **`Simulator.tsx`**: 공통 셸 `SimulatorShell`(`~/simulator`)에 시나리오, 영역 이름(`label`), 시각화 렌더 함수(`renderState`)를 넘기는 얇은 래퍼입니다. 시나리오 선택, 배치, 키보드 처리, 스크린 리더 안내, 콘솔 출력, 본문 열보다 넓게 표시하는 `data-wide`는 셸이 맡습니다. `renderState`는 현재 단계의 `state`와 이전 단계의 `prevState`(첫 단계는 `undefined`)를 받습니다. 시각화가 이전 상태를 쓰지 않으면 `state`만 받으면 됩니다.

   ```tsx
   export function Simulator({ scenarios }: { scenarios: Scenario<RenderState>[] }) {
     return (
       <SimulatorShell
         scenarios={scenarios}
         label="렌더링 시뮬레이터"
         renderState={(state, prevState) => <RenderView state={state} prevState={prevState} />}
       />
     )
   }
   ```

5. MDX에서는 **독립된 줄**에 둡니다(`<Simulator scenarios={scenarios} />` 앞뒤로 빈 줄). 같은 줄에 글이 붙으면 `<p>` 안에 감싸져 레이아웃과 `data-wide`가 깨집니다.

### 6. `route.tsx`

20줄 정도의 템플릿입니다. 첫 개념의 `route.tsx`를 복사하면 되고, 모양은 아래와 같습니다. 시뮬레이터는 route가 아니라 `content.mdx`에서 import합니다.

```tsx
import { ConceptLayout } from '~/components/concept/ConceptLayout'
import { mdxComponents } from '~/components/concept/mdx-components'
import { buildConceptMeta } from '~/lib/seo'
import Content from './content.mdx'
import { concept } from './meta'

export function meta() {
  return buildConceptMeta(concept)
}

export default function ConceptRoute() {
  return (
    <ConceptLayout concept={concept}>
      <Content components={mdxComponents} />
    </ConceptLayout>
  )
}
```

`loader`를 추가하지 않습니다.

### 7. 테스트

- React 예제 실행(L1, jsdom과 Chromium), 메타 무결성·필수 h2·JS 링크 무결성(L3), 빌드 결과(홈 목록, sitemap, canonical, 구조화 데이터(JSON-LD)와 sitemap `lastmod` 등)는 **공통 테스트가 폴더를 자동으로 찾아** 검사합니다. 따로 테스트를 쓸 필요가 없습니다.
- 시뮬레이터가 있다면 `concept.test.ts`를 추가해 시나리오마다 `assertScenarioInvariants(scenario, example, source)`를 호출합니다(`tests/helpers/scenario-invariants.ts`). 코드 원문 일치, 마지막 출력 일치, 출력 누적, `line` 범위, 단계 수를 검사합니다. 상태 참조 무결성은 상태 모양이 개념마다 다르므로 `concept.test.ts`에서 직접 검사합니다. 시뮬레이터가 있는 첫 개념의 `concept.test.ts`가 예시가 됩니다.
- 개념 0개로 시작하면서 개념에 묶인 테스트 일부를 제거했습니다(이전/다음 페이저, 개념 페이지 e2e, JS 꺼짐 e2e 등). 첫 개념을 추가할 때 이 테스트들을 다시 추가합니다. 제거한 테스트 목록은 `.claude/plans/react-uth-initial-setup.md`의 "구현 진행"에 있습니다.

### 8. dev 서버 재시작

`app/routes.ts`는 서버가 시작될 때만 `app/concepts/*` 폴더를 스캔합니다. 새 폴더를 만든 뒤에는 `npm run dev`를 재시작해야 `/concepts/<slug>`가 열립니다. (이미 있는 개념의 파일을 고칠 때는 재시작이 필요 없고, 예제 파일을 고치면 본문 코드 블록도 갱신됩니다.)

### 9. 전체 검증

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:build && npm run e2e
```

새 개념 폴더만 추가하고 공통 코드를 바꾸지 않았다면 전체 `npm run e2e` 대신 새 페이지 관련 e2e만 실행합니다. 이때 `tests/e2e/react-examples.spec.ts`를 반드시 포함합니다(명령과 공통 코드의 범위는 [AGENTS.md](../AGENTS.md)의 검증 순서).

`format:check`가 실패하면 `npm run format`으로 고칩니다. `e2e`·axe·가로 스크롤 검사는 개념마다 경로를 직접 등록한 페이지만 대상입니다(`tests/e2e/helpers.ts`의 경로 상수). 새 개념을 추가하면 브라우저에서 375px·다크 모드·키보드 조작을 직접 확인하고, 시뮬레이터가 있으면 `a11y.spec.ts`·`responsive.spec.ts`에 그 개념의 경로와 시뮬레이터 진행 검사를 추가합니다(기존 케이스는 고치지 않고 추가만 합니다).

### 10. 사용자 검토 후 `reviewedAt` 기록

작성자는 아래 L7 체크리스트로 자체 점검한 뒤 사용자에게 설명과 시각 표현의 검토를 요청합니다. 사용자가 승인하면 `meta.ts`의 `reviewedAt`을 승인 날짜(`'YYYY-MM-DD'`)로 바꿉니다. 승인 전에는 `null`이어야 하며 페이지에 "검토 중" 배지가 표시됩니다. 피드백은 같은 단계에서 반영한 뒤 다시 검토를 받습니다. `reviewedAt`은 구조화 데이터 `dateModified`와 sitemap `lastmod`로 쓰이므로, 본문을 고치면 다시 검토받고 `reviewedAt`을 갱신합니다.

## 작성 규칙

### 원칙

- 설명의 근거는 두 층입니다. 공개 동작은 react.dev 문서와 실제 실행 결과, 내부 구현은 React `v19.3.1` 태그에 고정한 소스 링크입니다. 모든 결과 주장은 `examples/`로 실행 검증합니다.
- 내부 구현은 "19.3.1 구현에서는"으로 서술하고 `simplifications`에 버전마다 바뀔 수 있음을 적습니다. 내부 구현을 공개 동작의 보장처럼 쓰지 않습니다.
- 비공식 분석 글(블로그, 영상 등)은 근거로 쓰지 않습니다.
- 교육용 비유와 그림(트리, 큐, 이중 버퍼 그림 등)을 React 내부 구현 그대로인 것처럼 쓰지 않습니다. 비유를 썼다면 `simplifications`에 적습니다.
- 확실하지 않은 내부 세부는 쓰지 않거나 "react.dev가 정하지 않는다"고 밝힙니다.
- 1부 페이지는 공개 동작만으로 설명하고, 내부 구현은 2부 페이지에서 다룹니다. 아직 쓰지 않은 개념을 앞서 설명하지 않습니다. 필요하면 `prerequisites`에 `label`만 적고, 단순화한 부분은 `simplifications`에 "별도 개념에서 다룬다"고 밝힙니다.
- 자바스크립트 언어 동작(클로저, 동등 비교, `this` 등)은 이 사이트에서 다시 설명하지 않고 `jsPrerequisites`나 `<JsLink>`로 JS Under the Hood에 연결합니다.

### 저작권

React 공식 문서와 소스 코드, 도서의 본문·예제·그림을 복사하거나 문장을 바꿔 옮기지 않습니다. 공식 문서는 근거 링크로 연결하고 설명과 예제는 직접 실행 결과를 바탕으로 새로 씁니다. 소스는 고정 링크로 가리키고 필요한 짧은 식별자(함수·필드 이름) 외에 코드를 길게 옮기지 않습니다.

### 용어

- react.dev의 용어를 우선합니다. 처음 나올 때 한국어 용어에 영어 원어를 함께 씁니다(예: 배칭(batching), 재조정(reconciliation), 커밋(commit)).
- 공개 동작과 내부 구현의 용어를 구분합니다. Fiber, lanes 같은 내부 용어는 2부 페이지에서 소스 근거와 함께 씁니다.
- 같은 대상을 한 페이지 안에서 같은 이름으로 부릅니다(예: "리렌더링"과 "다시 그리기"를 섞지 않기).

## L7 검토 체크리스트

개념마다 사용자 검토 게이트에서 아래를 확인합니다.

- [ ] **8요소 충족**: 소개·목표 / 선행 개념 / 원리 / 예제 / 시각화 / 단계 설명 / 결과와 이유 / 관련 링크가 모두 있다(시뮬레이터가 필요 없는 개념이면 시각화·단계 설명 대신 예제와 설명이 이를 충분히 대신한다).
- [ ] **근거 링크**: react.dev 해당 문서 링크가 있고, 내부 구현을 다루면 `v19.3.1` 고정 소스 링크가 있다. 모두 실제로 열어 내용을 확인했다.
- [ ] **공개 동작 vs 내부 구현**: react.dev가 보장하는 동작과 19.3.1 구현 세부를 섞어 쓰지 않았다.
- [ ] **React 18 차이**: 18과 달라진 점이 있으면 릴리스 노트·업그레이드 가이드로 확인해 `react18` Callout로 표시했다.
- [ ] **JS 링크 대상**: `jsPrerequisites`와 `<JsLink>`의 대상 페이지와 앵커가 JS 사이트에 실제로 있고(`npm run js-index:sync` 후 확인), 링크 문구가 그 페이지 내용과 맞다.
- [ ] **원인 설명**: 결과의 원인을 비유가 아니라 react.dev나 소스가 정의한 동작으로 설명했다.
- [ ] **불확실한 내부 세부 없음**: 확인하지 못한 구현을 사실처럼 쓰지 않았다.
- [ ] **단순화 목록 완전성**: 시각화와 설명이 단순화한 모든 부분(비유, 생략한 필드·단계, 다루지 않는 동작)이 `simplifications`에 빠짐없이 적혀 있다.
- [ ] 모든 실행 결과가 `npm test`(jsdom)와 `react-examples.spec.ts`(Chromium)로 실제 실행되어 검증되었고 단계 설명과 일치한다.
- [ ] 375px 폭과 다크 모드에서 읽고 조작할 수 있다.

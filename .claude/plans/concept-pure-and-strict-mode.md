# 개념 3: 순수 함수와 StrictMode (pure-and-strict-mode) 구현 계획

- 상태: 완료
- 작성일: 2026-11-12
- 기준: `main` @ `c9f3689`

## 0. 요약
- 목적: 로드맵 3번 개념 페이지 `/concepts/pure-and-strict-mode`(예제 4개, 시뮬레이터 시나리오 2개)를 추가한다. 컴포넌트가 순수해야 하는 이유와 StrictMode가 개발 중에 컴포넌트를 두 번 호출해 순수하지 않은 컴포넌트를 드러낸다는 것을 실행 결과로 보인다.
- 범위: `app/concepts/pure-and-strict-mode/` 신규, e2e `helpers`·`a11y`·`responsive`에 이 개념 케이스 추가(기존 케이스는 고치지 않음), 로드맵 3번 행 / 공통 컴포넌트·`app/lib`·`app/simulator`·설정·기존 개념은 바꾸지 않음
- 위험: "두 번째 호출 결과가 화면에 쓰인다", "호출은 컴포넌트마다 연달아 두 번" 같은 관찰을 react.dev의 보장처럼 쓸 수 있음 → 관찰로만 쓰고 simplifications에 "react.dev가 정하지 않음"을 적는다
- 복잡도: 중간 · Consensus: 생략 (1·2번 개념의 구조를 그대로 따르고 공통 코드를 바꾸지 않음. 2번 개념과 같은 판단. 내용 정확성은 실행 검증, critical-code-review, 사용자 L7 검토로 확인)
- 미확정: 없음

## 1. 요구사항
- 요구사항
  - 로드맵 3번 "순수 함수와 StrictMode: 왜 두 번 실행될까"(category `rendering`, order 30). 1부 공개 동작 페이지라 내부 구현(renderWithHooks 등)은 쓰지 않는다.
  - slug `pure-and-strict-mode`(사용자 확정, 2026-11-12).
  - 시뮬레이터 포함(사용자 확정).
  - 로드맵 "React 18 차이: 작성 시 확인(StrictMode 두 번째 렌더의 메모이제이션 재사용)" → 업그레이드 가이드로 확인한 것만 `react18` Callout에 쓴다.
  - `reviewedAt: null`. 구현·리뷰 후 사용자 검토(content-guide 10단계)를 받는다.
- 유지해야 하는 기존 동작: 공통 컴포넌트, 시뮬레이터 셸, 라우트, SEO, 하이드레이션 규칙, 기존 테스트의 단언, 기존 두 개념의 본문.
- 제외 범위
  - StrictMode의 effect 재실행(13번 "useEffect 실행 시점과 cleanup"), ref 콜백 재실행(12번 "ref"), 사용 중단 API 검사.
  - 업데이트 함수(`setCount(c => …)`)·`useMemo`·`useReducer`의 두 번 호출 예제(6번·15번 개념 범위이고, 업데이트 함수는 아래 2절처럼 StrictMode와 무관한 호출이 섞여 이 페이지에서 설명하기 어렵다).
  - 기존 개념(`jsx-to-element`, `render-and-commit`)의 simplifications·`related`를 이 개념으로 연결하는 일(9절 추가 개선 후보).
  - 커밋.

## 2. 사실과 추정
### 사실 (코드·문서·실행에서 확인)
- 새 개념은 폴더 추가만으로 라우트·홈·sitemap·공통 테스트에 잡힌다 — `docs/content-guide.md` 1·7절. 2번 개념의 구성(`meta.ts`, `content.mdx`, `route.tsx`, `examples/`, `scenarios.ts`, 시각화 컴포넌트, `Simulator.tsx`, `concept.test.ts`, `Simulator.test.tsx`, 시각화 테스트)을 그대로 따른다 — `app/concepts/render-and-commit/`.
- 시뮬레이터 래퍼는 `SimulatorShell`에 `scenarios`, `label`, `renderState`만 넘긴다 — `app/concepts/render-and-commit/Simulator.tsx`. `Step`은 `title`, `explanation`, `line?`, `state`, `output?` — `app/simulator/types.ts:3-9`.
- 예제 실행기는 모듈 import 후 settle, click마다 settle하며 `console.error/warn`·예외가 있으면 실패한다 — `tests/helpers/run-react-example.ts:10-75`. 따라서 예제 2가 통과하면 "결과가 달라도 React가 경고하지 않았다"는 관찰이 된다.
- 기존 픽스처: StrictMode 아래 `render`가 두 번, effect는 `effect`/`cleanup`/`effect` — `tests/fixtures/react-examples/cases.ts:13-17`.
- e2e 시뮬레이터 진행 케이스는 개념별 상수와 케이스를 추가하는 방식이다(2번 개념 커밋 `4e6f8f0`의 `tests/e2e/helpers.ts:10-12`, `a11y.spec.ts` "render-and-commit: 시뮬레이터를 진행한 뒤", `responsive.spec.ts` render-and-commit 2건).
- 본문 첫 문단에 `<JsLink>`를 두면 build-output `firstProseLine` 검사가 실패한다 — `.claude/plans/concept-jsx-to-element.md` "구현 진행" 작업 4.
- JS 인덱스(2026-11-12 동기화): `function-calls`, `scope-chain`(앵커 `이름을-찾는-순서` 있음) — `app/lib/js-site-index.json`.
- react.dev 근거(2026-11-12 열어 확인)
  - [StrictMode](https://react.dev/reference/react/StrictMode): 개발 중에만 ① 순수하지 않은 렌더로 생긴 버그를 찾으려고 컴포넌트를 한 번 더 렌더 ② effect를 한 번 더 실행 ③ ref 콜백을 한 번 더 실행 ④ 사용 중단 API 검사. 두 번 호출하는 것은 순수해야 하는 함수만이다: 컴포넌트 함수 본문(최상위 로직만, 이벤트 핸들러 안 코드는 제외), `useState`·`set` 함수·`useMemo`·`useReducer`에 넘긴 함수, 일부 클래스 메서드. 모든 검사는 개발 전용이며 프로덕션 빌드에 영향이 없다. React DevTools가 있으면 두 번째 호출의 `console.log`가 흐리게 보이고, 완전히 숨기는 설정(기본 꺼짐)이 있다. 트리 일부만 감싸면 프로덕션에서 가능한 동작만 켠다. 앵커: `#fixing-bugs-found-by-double-rendering-in-development`.
  - [Keeping Components Pure](https://react.dev/learn/keeping-components-pure): 순수 함수는 호출 전부터 있던 객체나 변수를 바꾸지 않고, 같은 입력이면 같은 결과를 낸다. React는 모든 컴포넌트가 순수 함수라고 가정한다. 바깥 변수를 읽고 쓰는 컴포넌트는 여러 번 호출하면 다른 JSX를 만든다. StrictMode는 개발 중 컴포넌트 함수를 두 번 호출해 규칙을 어긴 컴포넌트를 찾게 돕고, 프로덕션에는 영향이 없다. 렌더 중에 방금 만든 변수·객체를 바꾸는 것은 괜찮다(local mutation). 부수 효과는 보통 이벤트 핸들러에 두며, 마지막 수단으로 `useEffect`. 앵커: `#detecting-impure-calculations-with-strict-mode`, `#local-mutation-your-components-little-secret`, `#where-you-_can_-cause-side-effects`.
  - [useState](https://react.dev/reference/react/useState) Caveats: StrictMode에서 초기값 함수와 업데이트 함수를 두 번 호출하며 개발 전용이고, 두 호출 중 하나의 결과는 무시된다. 앵커: `#caveats`, `#setstate-caveats`.
  - [React 19 업그레이드 가이드](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) "StrictMode changes"(`#strict-mode-improvements`): StrictMode 두 번 렌더에서 `useMemo`·`useCallback`이 두 번째 렌더 때 첫 렌더의 메모이제이션 결과를 재사용한다. 처음 마운트할 때 ref 콜백을 두 번 호출한다.
- 시제품 실행(2026-11-12, 프로젝트 실행기 `runReactExample` + jsdom, React 19.3.1 개발 빌드, errors 0건). 8절 작업 1의 원문 그대로:
  - `impure-ticket`: `Ticket 렌더: 번호표 1` / `… 2` / `… 3` / `화면: ["번호표 1","번호표 2","번호표 3"]`
  - `impure-ticket-strict`: `Ticket 렌더: 번호표 1` ~ `… 6`(6줄) / `화면: ["번호표 2","번호표 4","번호표 6"]`
  - `pure-ticket-strict`: `Ticket 렌더: 번호표 1` ×2 / `… 2` ×2 / `… 3` ×2 / `화면: ["번호표 1","번호표 2","번호표 3"]`
  - `what-runs-twice`(click 1회): `Counter 본문` / `초기값 함수` / `초기값 함수` / `Counter 본문` / `클릭 핸들러` / `Counter 본문` / `Counter 본문`
- 설계에서 뺀 동작의 관찰(시제품, 예제에 쓰지 않음)
  - StrictMode에서 `setCount((c) => …)` 업데이트 함수 로그는 클릭 직후 렌더 전에 한 번, 렌더 중에 한 번 찍혔다. 렌더 전 호출은 StrictMode와 무관한 동작으로 보이며 react.dev가 설명하지 않는다 → 예제에서 제외.
  - `useMemo` 계산 함수는 첫 호출 안에서 두 번 찍히고, 두 번째 컴포넌트 호출에서는 첫 결과와 같은 객체를 썼다(업그레이드 가이드의 재사용과 일치). 15번 개념 범위라 예제에서 제외하고 Callout에 문서 근거로만 쓴다.

### 추정
- Chromium에서도 4개 예제의 출력이 jsdom과 같다 — 근거: 2번 개념의 MutationObserver 출력이 두 환경에서 같았다. 확인 시점: 작업 1(`react-examples.spec.ts`). 다르면 기대값을 고치지 않고 원인을 찾는다.

## 3. 구현 전략
- **예제 4개로 "순수하지 않음 → StrictMode가 드러냄 → 고침 → 무엇이 두 번 불리나"를 보인다.**
  1. `impure-ticket`(StrictMode 없음): 렌더 중 모듈의 `let nextNumber`를 읽고 늘리는 `Ticket` 3개. 화면은 번호표 1·2·3으로 문제없어 보인다.
  2. `impure-ticket-strict`: 같은 컴포넌트를 `<StrictMode>`로 감싼다. 로그가 6줄이 되고 화면은 2·4·6이 된다. 호출 횟수에 따라 결과가 달라지는 컴포넌트였다는 것이 드러난다. React는 경고하지 않는다(실행기 errors 0).
  3. `pure-ticket-strict`: 번호를 props로 받게 고친다. StrictMode 아래에서도 두 번 호출(로그 6줄)은 그대로지만 두 호출 결과가 같아 화면은 1·2·3이다.
  4. `what-runs-twice`: StrictMode에서 컴포넌트 본문과 `useState` 초기값 함수는 두 번, 클릭 핸들러는 한 번 호출된다. 클릭 후 다시 렌더할 때 본문은 두 번이고 초기값 함수는 더 부르지 않는다.
- **예제 1·2는 같은 컴포넌트 코드**로 둔다. StrictMode가 버그를 만든 것이 아니라 이미 있던 "호출 횟수 의존"을 드러냈다는 점을 비교로 보인다(misconception Callout의 근거).
- **관찰 장치**: 예제 1~3에 같은 MutationObserver 코드(4줄)를 둔다. DOM이 바뀐 뒤 `li`들의 글을 `JSON.stringify`로 찍는다. 2번 개념과 같은 관찰 방식이며, 본문 note Callout에서 관찰용임과 콜백이 DOM 변경 뒤에 불린다는 점을 밝힌다.
- **예제의 이름과 상황은 직접 만든다.** react.dev의 손님·컵 예제를 옮기지 않고 "번호표" 상황으로 쓴다(content-guide 저작권).
- **관찰과 보장을 구분해 쓴다.**
  - react.dev 보장: 개발 중 두 번 호출, 대상 함수 목록, 프로덕션 무영향, 두 결과 중 하나는 무시됨(useState Caveats).
  - 관찰(예제 출력): 화면 값이 각 Ticket의 두 번째 호출 값과 같았다, 한 Ticket을 연달아 두 번 호출했다, 경고가 없었다, 초기값 함수 두 번이 첫 본문 로그 뒤에 찍혔다. 본문에는 "이 예제에서는"으로 쓰고 simplifications에 react.dev가 정하지 않는다고 적는다.
- **용어**: react.dev를 따라 "순수 함수(pure function)", "부수 효과(side effect)", "StrictMode", "개발 빌드/프로덕션 빌드", "지역 변경(local mutation)". 두 번 호출은 "두 번 호출한다"로 통일한다("이중 렌더"·"더블 렌더"를 섞지 않음).
- **시뮬레이터**: 상태 모양은 이 개념 전용이다.
  ```ts
  type TicketCall = { position: number; call: 1 | 2; returns: string } // position: 몇 번째 Ticket(1~3), returns: 돌려준 JSX 요약 '<li>번호표 2</li>'
  type PurityState = {
    outer: { name: string; value: number | null } | null // 바깥 변수. null = 이 예제는 바깥 변수를 쓰지 않음, value null = 아직 선언 전
    calls: TicketCall[] // 이번 렌더에서 지금까지 호출된 순서
    screen: string[] | null // 커밋 뒤 화면의 li 글. null = 아직 비어 있음
  }
  ```
  시각화 `PurityView`는 세 영역을 세로로 둔다: 바깥 변수(이름 = 값), 컴포넌트 호출 기록(Ticket 위치별로 1번째·2번째 호출이 돌려준 JSX, 두 호출이 모두 있으면 "두 결과 같음"/"두 결과 다름" 텍스트 배지), 화면(`#root`의 li 목록). 색만으로 구분하지 않는다. 배지는 교육용 비교이며 React가 비교·경고하지 않는다는 점을 simplifications에 적는다.
- 버린 대안
  - 예제 2만 두고 StrictMode 없는 결과는 본문 문장으로 쓰기: 출력 주장은 예제로 검증해야 한다(AGENTS.md 예제 규칙).
  - react.dev처럼 배열 prop을 `push`로 바꾸는 예제: 7번 "객체·배열 state"·4번 "props는 읽기 전용"과 겹친다. 숫자 변수 하나로 호출 횟수 의존만 보인다.
  - effect 재실행까지 이 페이지에서 보이기: 13번 개념을 앞당긴다.
  - 업데이트 함수 두 번 호출 예제: 2절 관찰처럼 StrictMode와 무관한 호출이 섞인다.
  - 시뮬레이터에 트리거/렌더/커밋 단계 표시를 두기: 2번 개념과 중복이고 이 페이지의 핵심(같은 컴포넌트의 두 호출 결과 비교)을 흐린다. render 호출 단계 하나와 커밋 단계 하나만 둔다.

## 4. 변경 파일
- 추가 `app/concepts/pure-and-strict-mode/`
  - `meta.ts`, `content.mdx`, `route.tsx`(2번 개념 route와 같은 내용)
  - `examples/impure-ticket.jsx`, `examples/impure-ticket-strict.jsx`, `examples/pure-ticket-strict.jsx`, `examples/what-runs-twice.jsx`
  - `scenarios.ts`, `PurityView.tsx`, `Simulator.tsx`
  - `concept.test.ts`, `Simulator.test.tsx`, `PurityView.test.tsx`
- 수정 `tests/e2e/helpers.ts`: `PURE_STRICT_PATH = '/concepts/pure-and-strict-mode'`, `PURE_STRICT_SIMULATOR_NAME = 'StrictMode 두 번 호출 시뮬레이터'` export 추가(기존 상수 그대로).
- 수정 `tests/e2e/a11y.spec.ts`: light/dark 각각 "pure-and-strict-mode: 시뮬레이터를 진행한 뒤" 추가.
- 수정 `tests/e2e/responsive.spec.ts`: "pure-and-strict-mode: 가로 스크롤이 없다", "pure-and-strict-mode: 시뮬레이터를 끝까지 진행해도 가로 스크롤이 없다" 추가.
- 수정 `.claude/plans/concept-roadmap.md`: 상태 줄에 "3번 작성 2026-11-12", 3번 행 JS 연결 확정 값, React 18 차이 확정 문구.
- 변경하지 않음: `app/components/`, `app/simulator/`, `app/lib/`, `app/routes*`, 설정, `tests/helpers/`, `tests/build/`, 기존 e2e 케이스, `jsx-to-element`, `render-and-commit`.

## 5. 위험 요소
- 관찰을 보장처럼 쓰기(화면이 두 번째 호출 값, 연달아 두 번 호출, 경고 없음, 초기값 함수 로그 위치) → 본문은 "이 예제에서는"으로, simplifications에 react.dev가 정하지 않음을 적는다(작업 2, 7 L7 점검).
- jsdom과 Chromium 출력 차이 → `react-examples.spec.ts`로 대조, 다르면 기대값을 고치지 않고 원인을 찾는다(작업 1, 6).
- 예제 1·2의 모듈 변수 `nextNumber`를 독자가 따라 쓸 수 있다 → 코드 주석 없이도 본문과 예제 3 비교로 잘못된 패턴임을 밝히고, note Callout에 "의도적으로 순수하지 않게 쓴 예제"라고 쓴다(작업 2).
- jsdom 테스트는 같은 파일의 예제끼리 React 모듈 상태를 공유한다 → 각 예제는 자기 모듈 변수만 쓰고, 실행기가 `vi.resetModules()`로 모듈을 다시 불러오므로 `nextNumber`는 예제마다 1부터 시작한다(시제품에서 순서대로 실행해 확인).
- 시뮬레이터 `line`과 예제 줄 번호 불일치 → 예제 원문을 작업 1과 똑같이 두고 `assertScenarioInvariants`가 범위를 검사(작업 3).
- 본문 첫 문단 `<JsLink>` → 둘째 문단에 둔다(작업 2).
- `**…**` 닫는 별표 뒤 한글, JSX 컴포넌트 안 인라인 코드 줄바꿈 공백 → content-guide 4절 규칙과 빌드 후 grep(작업 2, 6).
- e2e 추가가 기존 케이스를 바꾸면 안 된다 → `git diff tests/e2e`에 삭제 줄 없음(작업 5). 단 import 목록은 여러 줄로 다시 쓰이므로 import 줄 변경만 허용한다.
- 에지 케이스: 예제 4의 초기값 함수가 클릭 뒤 다시 불리지 않는 것은 state가 이미 있기 때문이다(useState 문서: 초기값은 첫 렌더에만 쓰임). 이 근거를 본문에 함께 쓴다.

## 6. 검증 방법
- 정적·단위: `npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:build`
- e2e(공통 코드를 바꾸지 않으므로 범위 실행): `npx playwright test tests/e2e/navigation.spec.ts tests/e2e/react-examples.spec.ts && npx playwright test -g "pure-and-strict-mode"`. 추가 케이스 이름에 모두 `pure-and-strict-mode`를 넣는다.
- 빌드 결과 grep: `grep -o '<code>[^<]*  [^<]*</code>' build/client/concepts/pure-and-strict-mode/index.html` 결과 없음, 본문에 `**`가 그대로 남은 곳 없음.
- 브라우저(dev 서버 재시작 후 `/concepts/pure-and-strict-mode`. 다른 세션이 8888을 쓰면 빌드 결과를 임시 정적 서버로 띄워 확인하고 설정을 되돌린다)
  1. 페이지 200, 콘솔 에러 0, 실패 요청 0.
  2. 시뮬레이터 시나리오 1(바깥 변수를 바꾸는 Ticket): 단계 4~9에서 바깥 변수가 2→7로 하나씩 늘고, 각 Ticket의 두 호출이 모두 보이는 단계(5·7·9)에서 "두 결과 다름" 배지, 10단계 화면이 번호표 2·4·6.
  3. 시나리오 2(props만 쓰는 Ticket): 바깥 변수 영역이 "바깥 변수를 쓰지 않습니다", 5·7·9단계에서 "두 결과 같음", 10단계 화면이 1·2·3.
  4. 375px·다크 모드에서 두 시나리오를 끝까지 진행해도 가로 넘침이 없다.
  5. 퀴즈 4개가 하이드레이션 후 라디오로, JS 없이 `<details>`로 보인다(test:build가 검사).

## 7. 미확정 사항
- 없음

## 8. 작업 순서

### 1. 예제 4개 작성과 출력 확정
- 대상: `app/concepts/pure-and-strict-mode/examples/*.jsx`, `meta.ts`(examples만 먼저)
- 현재: 없음(시제품만 scratchpad `strict-proto/`에 있음)
- 변경: 아래 원문 그대로 만든다(파일 끝 줄바꿈 하나). `meta.examples`에 등록: `impure-ticket`, `impure-ticket-strict`, `pure-ticket-strict`(상호작용 없음), `what-runs-twice`(`interactions: [{ type: 'click', selector: 'button' }]`). 처음에는 `expectedOutput: []`로 두고 `npm test`의 실제 출력이 2절 시제품 출력과 같으면 채운다.
- 이유: 모든 결과 주장의 근거다.
- 주의사항: 줄 번호는 시뮬레이터 `line`이 쓰므로 원문을 바꾸지 않는다. `console.log` 문자열에 `%`를 쓰지 않는다.
- 완료 조건: `npx vitest run tests/react-examples.test.ts`에서 이 개념 예제 4개 통과, 기대값이 2절 출력과 줄 단위로 같다. build 후 `npx playwright test tests/e2e/react-examples.spec.ts -g pure-and-strict-mode` 4개 통과(Chromium). 음성 확인: `impure-ticket-strict` 마지막 줄을 `화면: ["번호표 1","번호표 3","번호표 5"]`로 바꾸면 jsdom이 실패하고, 되돌리면 통과한다.

`examples/impure-ticket.jsx`
```jsx
import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')
let nextNumber = 1

function Ticket() {
  const number = nextNumber
  nextNumber = nextNumber + 1
  console.log('Ticket 렌더: 번호표 ' + number)
  return <li>번호표 {number}</li>
}

// 관찰용 코드(React 기능 아님): #root 안의 DOM이 바뀌면 화면에 보이는 번호표를 찍습니다.
new MutationObserver(() => {
  const shown = [...rootNode.querySelectorAll('li')].map((li) => li.textContent)
  console.log('화면: ' + JSON.stringify(shown))
}).observe(rootNode, { childList: true, subtree: true, characterData: true })

createRoot(rootNode).render(
  <ul>
    <Ticket />
    <Ticket />
    <Ticket />
  </ul>,
)
```
(줄 번호: 변수 4, Ticket 6-11, 관찰 코드 13-17, render 19-25)

`examples/impure-ticket-strict.jsx`
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')
let nextNumber = 1

function Ticket() {
  const number = nextNumber
  nextNumber = nextNumber + 1
  console.log('Ticket 렌더: 번호표 ' + number)
  return <li>번호표 {number}</li>
}

// 관찰용 코드(React 기능 아님): #root 안의 DOM이 바뀌면 화면에 보이는 번호표를 찍습니다.
new MutationObserver(() => {
  const shown = [...rootNode.querySelectorAll('li')].map((li) => li.textContent)
  console.log('화면: ' + JSON.stringify(shown))
}).observe(rootNode, { childList: true, subtree: true, characterData: true })

createRoot(rootNode).render(
  <StrictMode>
    <ul>
      <Ticket />
      <Ticket />
      <Ticket />
    </ul>
  </StrictMode>,
)
```
(줄 번호: 변수 4-5, Ticket 7-12, 관찰 코드 14-18, render 20-28)

`examples/pure-ticket-strict.jsx`
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')

function Ticket({ number }) {
  console.log('Ticket 렌더: 번호표 ' + number)
  return <li>번호표 {number}</li>
}

// 관찰용 코드(React 기능 아님): #root 안의 DOM이 바뀌면 화면에 보이는 번호표를 찍습니다.
new MutationObserver(() => {
  const shown = [...rootNode.querySelectorAll('li')].map((li) => li.textContent)
  console.log('화면: ' + JSON.stringify(shown))
}).observe(rootNode, { childList: true, subtree: true, characterData: true })

createRoot(rootNode).render(
  <StrictMode>
    <ul>
      <Ticket number={1} />
      <Ticket number={2} />
      <Ticket number={3} />
    </ul>
  </StrictMode>,
)
```
(줄 번호: rootNode 4, Ticket 6-9, 관찰 코드 11-15, render 17-25)

`examples/what-runs-twice.jsx`
```jsx
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

function Counter() {
  console.log('Counter 본문')
  const [count, setCount] = useState(() => {
    console.log('초기값 함수')
    return 0
  })

  function handleClick() {
    console.log('클릭 핸들러')
    setCount(count + 1)
  }

  return <button onClick={handleClick}>{count}</button>
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Counter />
  </StrictMode>,
)
```

### 2. meta·route·본문(시뮬레이터 제외)
- 대상: `meta.ts`(나머지 필드), `route.tsx`, `content.mdx`
- 현재: 없음
- 변경
  - `meta.ts`
    - `slug: 'pure-and-strict-mode'`, `title: '순수 함수와 StrictMode: 왜 두 번 실행될까'`, `category: 'rendering'`, `order: 30`
    - `summary`(160자 이하): React는 컴포넌트를 순수 함수로 가정하고, StrictMode는 개발 중에 컴포넌트를 두 번 호출해 호출 횟수에 따라 결과가 달라지는 컴포넌트를 드러낸다는 내용.
    - `tags`: StrictMode, Strict Mode, 엄격 모드, 순수 함수, 순수성, pure, 부수 효과, side effect, 두 번 호출, 두 번 렌더, double render, 개발 모드, 개발 빌드, useState 초기값, 지역 변경
    - `goals`: ① 순수한 컴포넌트의 조건(같은 입력이면 같은 결과, 렌더 전부터 있던 값을 바꾸지 않음)을 말할 수 있다 ② StrictMode가 개발 중에 무엇을 두 번 호출하고 무엇은 한 번만 호출하는지 설명할 수 있다 ③ 렌더 중에 바깥 변수를 바꾸는 컴포넌트를 찾아 props로 고칠 수 있다
    - `prerequisites: [{ label: '렌더링은 컴포넌트 함수를 호출하는 것', slug: 'render-and-commit' }]`
    - `jsPrerequisites: [{ label: '함수 호출', slug: 'function-calls' }, { label: '스코프 체인: 바깥 변수를 찾는 순서', slug: 'scope-chain', anchor: '이름을-찾는-순서' }]` — 작업 전에 `npm run js-index:sync`로 다시 확인한다.
    - `related: ['render-and-commit', 'jsx-to-element']`
    - `simplifications`(빠짐없이):
      1. 예제는 개발 빌드에서 실행합니다. react.dev에 따르면 StrictMode의 검사는 개발 중에만 동작하고 프로덕션 빌드에서는 컴포넌트를 두 번 호출하지 않습니다. 프로덕션 동작은 예제로 확인하지 않았습니다.
      2. StrictMode가 effect와 ref 콜백을 한 번 더 실행하는 동작은 "useEffect 실행 시점과 cleanup"과 "ref" 개념에서 다룹니다. 사용 중단 API 검사와 트리 일부만 감싸는 경우는 다루지 않습니다. 예제에는 effect와 ref가 없습니다.
      3. 두 번 호출 대상 중 set 함수에 넘긴 업데이트 함수, useMemo, useReducer에 넘긴 함수는 예제로 보이지 않습니다.
      4. React가 두 호출 중 어느 결과를 화면에 쓰는지는 react.dev가 정하지 않습니다(useState 문서는 한쪽 결과를 무시한다고만 씁니다). 예제 2에서 화면 값이 각 Ticket의 두 번째 호출 값과 같았던 것은 이 실행의 관찰입니다. 순수한 컴포넌트라면 두 결과가 같으므로 어느 쪽이든 화면은 같습니다.
      5. 한 Ticket을 연달아 두 번 호출한 순서와 예제 4의 로그 순서(초기값 함수 두 번이 첫 본문 로그 뒤)는 이 실행의 관찰이며 react.dev가 정한 것이 아닙니다.
      6. StrictMode는 두 호출 결과가 달라도 경고하지 않았습니다(예제 2에서 경고 없음). 시뮬레이터의 "두 결과 같음/다름" 배지는 교육용 비교이며 React가 하는 일이 아닙니다.
      7. React DevTools를 설치하면 두 번째 호출의 console.log가 흐리게 보이고 숨기는 설정도 있습니다(react.dev). 이 사이트의 예제 실행기는 모든 console.log를 그대로 기록합니다.
      8. 예제 1·2의 모듈 변수 nextNumber는 순수하지 않은 컴포넌트를 보이려고 일부러 쓴 코드입니다.
      9. 관찰 코드(MutationObserver)는 DOM이 바뀐 뒤에 화면의 번호표를 찍습니다. 시뮬레이터는 render 호출과 컴포넌트 호출을 단계로 나눠 보이지만 컴포넌트 호출은 render 줄에서 바로 일어나지 않으며("렌더링은 컴포넌트 함수를 호출하는 것" 개념), 커밋은 한 단계로 묶었습니다. 바깥 변수 상자·호출 기록·화면 상자는 교육용 그림이며 React 내부 자료구조가 아닙니다.
    - `references`: StrictMode(`https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development`), Keeping Components Pure(`https://react.dev/learn/keeping-components-pure`), useState Caveats(`https://react.dev/reference/react/useState#caveats`), React 19 업그레이드 가이드 StrictMode changes(`https://react.dev/blog/2024/04/25/react-19-upgrade-guide#strict-mode-improvements`), MDN MutationObserver(`https://developer.mozilla.org/ko/docs/Web/API/MutationObserver`). 작업 중 링크를 열어 앵커를 다시 확인한다.
    - `reviewedAt: null`
  - `route.tsx`: `app/concepts/render-and-commit/route.tsx`와 같은 내용.
  - `content.mdx`(시뮬레이터 import·배치는 작업 3에서 추가)
    - 첫 문단: StrictMode로 감싼 앱에서 컴포넌트 로그가 두 번 찍히는 이유를, 순수 함수라는 React의 가정과 함께 실행 결과로 확인한다는 소개. `<JsLink>` 없음.
    - 둘째 문단: 컴포넌트는 함수라는 전제 `<JsLink slug="function-calls">함수 호출</JsLink>`, 함수가 바깥 변수를 읽고 바꾸는 방식 `<JsLink slug="scope-chain" anchor="이름을-찾는-순서">스코프 체인</JsLink>`.
    - `## 동작 원리`
      - React는 컴포넌트를 순수 함수로 가정한다: 같은 입력(props·state)이면 같은 JSX, 렌더 전부터 있던 변수·객체를 바꾸지 않는다. 렌더 중 새로 만든 값을 바꾸는 지역 변경은 괜찮다. 부수 효과는 보통 이벤트 핸들러에 둔다(useEffect는 13번 개념).
      - StrictMode는 개발 중에만 순수해야 하는 함수를 두 번 호출한다: 컴포넌트 본문(이벤트 핸들러 안 코드는 제외), useState·set 함수·useMemo·useReducer에 넘긴 함수. 순수하면 두 번 불러도 결과가 같으므로 문제가 없고, 순수하지 않으면 결과가 달라져 버그가 드러난다. 프로덕션에서는 두 번 호출하지 않는다.
      - `<Callout type="note" title="예제의 관찰용 코드">`: MutationObserver의 역할과 호출 시점, 예제 1·2는 일부러 순수하지 않게 쓴 코드라는 점.
    - `## 예제`
      - `### 예제 1: 렌더 중에 바깥 변수를 바꾸는 컴포넌트` + 코드 + 해설(화면 1·2·3, 겉보기에 문제없음. 그러나 결과가 호출 횟수에 달려 있다). 퀴즈 없음(예제 2와 짝).
      - `### 예제 2: 같은 컴포넌트를 StrictMode로 감싸면` + 코드 + `PredictQuiz`("화면에 보이는 번호표는?", 정답 `번호표 2, 4, 6`, 오답 `1, 2, 3` / `1, 3, 5` / `4, 5, 6`) + 해설(로그 6줄, 이 예제에서는 각 Ticket을 연달아 두 번 호출했고 화면 값은 두 번째 호출 값과 같다, 경고 없음).
      - `### 시뮬레이터로 확인하기`(작업 3)
      - `### 예제 3: 번호를 props로 받는 순수한 컴포넌트` + 코드 + `PredictQuiz`("Ticket 렌더 로그는 몇 줄?", 정답 6줄, 오답 3줄 / 2줄 / 1줄) + 해설(두 번 호출은 그대로, 두 결과가 같아 화면 1·2·3).
      - `### 예제 4: StrictMode가 두 번 부르는 것과 한 번 부르는 것` + 코드 + `PredictQuiz`("버튼을 한 번 누른 뒤 새로 찍히는 줄은?", 정답 `클릭 핸들러` 1줄과 `Counter 본문` 2줄, 오답 `클릭 핸들러` 2줄과 `Counter 본문` 2줄 / `클릭 핸들러` 1줄과 `Counter 본문` 1줄 / `클릭 핸들러`·`초기값 함수`·`Counter 본문` 각 2줄) + 해설(본문 두 번, 초기값 함수는 첫 렌더에서만 두 번, 핸들러는 순수할 필요가 없어 한 번).
      - `<Callout type="react18">`: React 19부터 StrictMode가 두 번 렌더할 때 useMemo·useCallback은 두 번째 렌더에서 첫 렌더의 결과를 재사용하고, 처음 마운트할 때 ref 콜백을 두 번 호출한다(업그레이드 가이드 링크). 이 페이지의 예제에는 해당 API가 없고 각각 15번·12번 개념에서 다룬다.
    - `## 결과와 이유`: 요약 문단 + JSX `<table>`(열: 예제 / StrictMode / Ticket 렌더 로그 / 화면 / 이유. 행: 예제 1·2·3) + 예제 4 한 줄 요약 + `<Callout type="misconception" title="StrictMode가 버그를 만든다">`(예제 1과 2는 같은 컴포넌트 코드이며, StrictMode는 이미 있던 호출 횟수 의존을 드러냈을 뿐이라는 근거).
- 이유: 페이지 본문과 메타.
- 주의사항: react.dev 문장·예제를 옮기지 않고 직접 쓴다. 본문 주장은 2절 근거와 예제 출력만 쓰고, 관찰은 "이 예제에서는"으로 쓴다. 내부 용어(Fiber, renderWithHooks 등)를 쓰지 않는다. JS 사이트 URL을 직접 쓰지 않는다. JSX 컴포넌트(Callout) 안 인라인 코드는 줄바꿈 공백 규칙을 지킨다.
- 완료 조건: `npx vitest run tests/content-integrity.test.ts` 통과(필수 h2, JS 링크 앵커, prerequisites·related slug, summary 길이), `npm run typecheck`·`npm run lint` 통과.

### 3. 시뮬레이터
- 대상: `scenarios.ts`, `PurityView.tsx`, `Simulator.tsx`, `content.mdx`(import와 배치), `concept.test.ts`, `Simulator.test.tsx`, `PurityView.test.tsx`
- 현재: 없음
- 변경
  - `scenarios.ts`: 3절 상태 타입, 예제를 `?raw`로 import. 각 단계의 `output`은 그 시점까지 누적된 출력.
    - `impure-strict`(label "바깥 변수를 바꾸는 Ticket", exampleId `impure-ticket-strict`, 10단계): ① 실행 전(outer `{ name: 'nextNumber', value: null }`, calls [], screen null) ② 바깥 변수와 관찰 코드 준비(line 4-18, value 1) ③ render 호출(line 20-28, calls []) ④ 첫 Ticket 1번째 호출(line 7-12, value 2, `<li>번호표 1</li>`) ⑤ 첫 Ticket 2번째 호출(value 3, `<li>번호표 2</li>`) ⑥ 둘째 1번째(value 4, 번호표 3) ⑦ 둘째 2번째(value 5, 번호표 4) ⑧ 셋째 1번째(value 6, 번호표 5) ⑨ 셋째 2번째(value 7, 번호표 6) ⑩ 커밋(line 없음, screen `['번호표 2', '번호표 4', '번호표 6']`, 출력에 `화면: …` 추가)
    - `pure-strict`(label "props만 쓰는 Ticket", exampleId `pure-ticket-strict`, 10단계): ① 실행 전(outer null) ② 관찰 코드 준비(line 4-15) ③ render 호출(line 17-25) ④~⑨ Ticket 위치 1·2·3의 1번째·2번째 호출(line 6-9, 두 호출 모두 `<li>번호표 n</li>`) ⑩ 커밋(screen `['번호표 1', '번호표 2', '번호표 3']`)
    - ③ explanation은 render 호출이 요청이며 컴포넌트 호출은 그 뒤에 일어난다는 점(2번 개념)을 밝힌다.
  - `PurityView.tsx`: 3절 세 영역. 영역마다 `section aria-labelledby`(2번 개념 `Area` 패턴). 빈 상태 문구: outer null "이 예제는 바깥 변수를 쓰지 않습니다", value null "아직 선언 전", calls 비어 있음 "아직 호출한 컴포넌트 없음", screen null "비어 있음". Ticket 위치별 묶음에 1번째·2번째 호출 JSX를 보이고, 두 호출이 모두 있으면 "두 결과 같음"/"두 결과 다름" 텍스트 배지(`data-same="true|false"`). 긴 텍스트는 `break-words`, 세로로 쌓아 375px에서 넘치지 않게 한다.
  - `Simulator.tsx`: `label="StrictMode 두 번 호출 시뮬레이터"`, `renderState={(state) => <PurityView state={state} />}`.
  - `content.mdx`: 맨 위 `import { Simulator } from './Simulator'`, `import { scenarios } from './scenarios'`. 예제 2 뒤 `### 시뮬레이터로 확인하기` 소개 한 문단과 독립된 줄의 `<Simulator scenarios={scenarios} />`.
  - `concept.test.ts`: 시나리오마다 `assertScenarioInvariants`. 구성(id·exampleId·단계 수 10·10), 첫 단계 line 없음·output 빈 배열, calls는 단계마다 이전 단계에 하나씩만 늘거나 그대로, screen은 마지막(커밋) 단계 전까지 null, 커밋 단계는 line 없음, impure-strict는 호출 단계마다 outer.value가 1씩 늘고 같은 위치의 두 호출 returns가 다름, pure-strict는 outer가 null이고 같은 위치의 두 호출 returns가 같음, 각 시나리오의 커밋 screen이 각 위치의 2번째 호출 returns의 글과 같음(예제 출력의 `화면:` 줄과도 같음).
  - `Simulator.test.tsx`: 첫 단계 표시, 시나리오 전환 시 1단계, 각 시나리오 마지막 단계 콘솔 출력 = `expectedOutput`, 키보드 →/←/Home(2번 개념 테스트 패턴, `REGION_NAME = 'StrictMode 두 번 호출 시뮬레이터'`).
  - `PurityView.test.tsx`: 빈 상태 문구 4종, impure-strict ⑤에서 "두 결과 다름" 1개, ⑨에서 3개, pure-strict ⑨에서 "두 결과 같음" 3개, ⑩ 화면 목록.
- 이유: 같은 컴포넌트의 두 호출 결과를 나란히 비교하는 핵심 시각화.
- 주의사항: Step의 state는 전체 스냅샷이다. 첫 단계는 JS 없이 프리렌더된다. 색만으로 구분하지 않는다.
- 완료 조건: `npx vitest run app/concepts/pure-and-strict-mode` 통과. 음성 확인: pure-strict ⑤의 returns를 `<li>번호표 2</li>`로 바꾸면 `concept.test.ts`가 실패하고, 되돌리면 통과한다.

### 4. 로드맵 갱신
- 대상: `.claude/plans/concept-roadmap.md`
- 변경: 상태 줄에 "3번 작성 2026-11-12" 추가, 3번 행 JS 연결을 `확정: \`function-calls\`, \`scope-chain\``로, React 18 차이를 "있음: 두 번째 렌더에서 useMemo·useCallback 결과 재사용, 마운트 때 ref 콜백 두 번 호출 (업그레이드 가이드)"로.
- 완료 조건: 3번 행이 meta의 `jsPrerequisites`·react18 Callout과 같다.

### 5. e2e 케이스 추가
- 대상: `tests/e2e/helpers.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/responsive.spec.ts`
- 변경: 4절대로 상수와 케이스를 추가한다. a11y는 light/dark 블록 안에 render-and-commit 케이스와 같은 방식으로 두 시나리오(라디오 이름 "바깥 변수를 바꾸는 Ticket", "props만 쓰는 Ticket", 각 10단계)의 모든 단계에서 axe를 돌리고 마지막에 `다음`이 `aria-disabled="true"`인지 본다. responsive는 경로 가로 스크롤 1건과 시뮬레이터 진행 1건.
- 주의사항: 기존 케이스·상수를 고치지 않는다. 테스트 이름에 `pure-and-strict-mode`를 넣는다.
- 완료 조건: `git diff tests/e2e`의 삭제 줄이 import 목록 재작성뿐이다. `npx playwright test -g "pure-and-strict-mode" --list`에 추가 케이스가 나온다(a11y light·dark 각 1, responsive 2, 프로젝트 수만큼).

### 6. 전체 검증
- 6절 명령을 순서대로 실행하고 6절 브라우저 시나리오를 확인한다.
- 완료 조건: 모든 명령 통과, 빌드 HTML grep 0건, 브라우저 시나리오 1~4의 관찰값이 6절과 같다.

### 7. L7 자체 점검
- content-guide L7 체크리스트를 항목별로 확인하고 결과를 "구현 진행"에 적는다. react.dev 링크 4개와 MDN 링크를 실제로 열어 앵커를 확인하고, 본문 문장마다 근거(2절 문서 문장 또는 예제 출력)가 있는지, 관찰을 보장처럼 쓴 문장이 없는지 대조한다.
- 완료 조건: 체크리스트 10항목에 결과가 기록되어 있다.

## 9. 추가 개선 후보
- `jsx-to-element`·`render-and-commit`의 simplifications("순수 함수와 StrictMode 개념에서 다룹니다")와 `related`를 이 개념으로 연결. 기존 개념 본문 변경이라 다시 검토와 `reviewedAt` 갱신이 필요하다(content-guide 10단계). 이번 범위에서 제외.

### 8. 사용자 검토 의견 반영 (2026-11-12)
- 대상: `content.mdx`, `meta.ts`(simplifications), `scenarios.ts`(조사)
- 변경
  1. (Major, 순수성이 필요한 이유) 동작 원리의 두 번 호출 문단 뒤에 react.dev 근거 문단 추가: 렌더는 언제든 일어날 수 있고 컴포넌트는 서로의 렌더 순서에 기대면 안 된다(Recap), 입력이 바뀌지 않은 컴포넌트의 렌더를 건너뛸 수 있고 깊은 트리를 렌더하는 중에 데이터가 바뀌면 렌더를 다시 시작할 수 있다(Deep Dive `#why-does-react-care-about-purity`). 그래서 프로덕션에서 두 번 호출하지 않아도 호출 횟수에 기대는 코드는 틀렸고, StrictMode는 이를 개발 중에 드러내는 장치다. misconception Callout에도 한 문장. "4·5·6" 같은 실행 수치는 쓰지 않는다(사용자 결정: 문서 근거 문단만, 8번 개념을 앞당기지 않음).
  2. (Major, react18 Callout) 18의 동작을 먼저 쓴다: React 18에서는 두 번째 렌더가 useMemo·useCallback을 다시 계산했고 처음 마운트할 때 ref 콜백을 한 번 더 실행하지 않았다 → 19부터 첫 렌더 결과를 다시 쓰고, 마운트 때 ref 콜백을 한 번 더 실행한다(업그레이드 가이드가 19의 변경으로 적은 두 항목). useMemo가 두 번 호출 대상인 것과 결과 재사용이 함께 어떻게 동작하는지는 15번 개념으로 넘긴다(내부 구현 설명 안 함). 18.3.1 실행 로그 순서는 쓰지 않는다(AGENTS.md 규칙, 앞선 사용자 결정과 같은 기준).
  3. (Minor, 예제 4 순서) 해설과 simplifications 5번을 "이 실행(React 19.3.1)에서는 Counter 본문 → 초기값 함수 → 초기값 함수 → Counter 본문 순서. 순서는 react.dev가 정하지 않으며 버전에 따라 다를 수 있다"로.
  4. (Minor, 같은 JSX) 동작 원리에 "같은 JSX는 같은 객체가 아니라 같은 화면을 나타내는 결과이며, element와 핸들러 함수는 호출마다 새로 만들어진다"를 추가. simplifications 6번에 배지는 JSX 요약 글을 비교한다는 점 추가.
  5. (Minor, 생략 표기) simplifications에 "입력은 props·state만 다룸, react.dev는 context도 입력으로 꼽음, 두 번 호출 대상의 일부 클래스 컴포넌트 메서드는 다루지 않음(함수 컴포넌트만)" 추가.
  6. (Minor, ref 콜백) "ref 콜백을 두 번 호출" → "ref 콜백을 한 번 더 실행"(StrictMode 문서 표현).
  7. (Minor, 부수 효과 정의) react.dev 정의로: 화면 갱신·애니메이션 시작·데이터 변경처럼 렌더 중이 아니라 그 곁에서 일어나는 변화.
  8. (기타) 시뮬레이터 설명의 숫자 뒤 조사(로/으로, 을/를, 이/가)를 숫자에 맞춘다.
- 주의사항: 예제 파일·기대 출력·시나리오 상태는 바꾸지 않는다. 내부 구현 용어를 쓰지 않는다.
- 완료 조건: lint·format:check·typecheck·npm test·test:build 통과, 빌드 HTML에 새 문장 확인·`<code>` 공백 0, e2e `-g pure-and-strict-mode` 통과, 시뮬레이터 설명에 "2을"·"6로"·"3로" 같은 조사 오류 없음(grep), 수정 범위 재리뷰 Critical·High 0.

## 변경 이력
- 2026-11-12 (사용자 재검토 Minor 2): 작업 순서 8의 ①·② 문구 수정 — 렌더 건너뛰기를 React 기본 동작처럼 쓴 문장과 문서에 없는 "처음부터"를 고치고, useCallback에 "값을 새로 계산"을 쓰지 않음. 범위 변화 없음 → 상태 `승인` 유지
- 2026-11-12 (사용자 검토 의견 Major 2·Minor 5·기타): 작업 순서 8 추가. 지적 1은 문서 근거 문단만(사용자 결정), 지적 2의 18 실행 순서는 쓰지 않음(AGENTS.md·앞선 결정). 접근 방식·범위 변화 없음 → 상태 `승인` 유지
- 2026-11-12 (구현 중 정정): 6절 브라우저 시나리오 5의 "퀴즈 4개"를 "퀴즈 3개"로 정정. 작업 2가 퀴즈를 예제 2·3·4에만 두도록 정했으므로(예제 1은 예제 2와 짝) 계획 안의 불일치를 바로잡은 것이며 범위 변화 없음.

## 구현 진행

- baseline (2026-11-12, `c9f3689`): lint·format:check·typecheck 통과 / vitest 24 files·182 통과
- 구현 분담: 작업 1·2·4는 메인(예제는 계획 원문, 본문·메타·로드맵은 문서), 작업 3(시뮬레이터)·5(e2e)는 Sonnet 서브에이전트 2개 병렬(파일 겹침 없음, content.mdx는 메인 전담)
- [x] 1. 예제 4개와 출력 확정 — 시제품 파일을 그대로 옮김(파일 끝 줄바꿈 확인). `npm run js-index:sync`(unchanged, 56개). jsdom `tests/react-examples.test.ts` 16 통과(이 개념 4). 음성: `impure-ticket-strict` 마지막 기대값을 `["번호표 1","번호표 3","번호표 5"]`로 바꾸면 1 failed, 되돌리면 통과. Chromium: build 후 `react-examples.spec.ts` desktop 4개 통과 → 2절 추정 확인
- [x] 2. meta·route·본문 — content-integrity 53 통과, typecheck·lint 통과. Prettier가 react18 Callout을 다시 나누며 `</code>` 뒤 조사 "은"이 줄 머리로 가 공백이 생김 → "두 번째 렌더의 `useMemo`, `useCallback` 훅은"으로 문장을 바꿔 해소(빌드 HTML `<code>` 공백 grep 0)
- [x] 3. 시뮬레이터 — 서브에이전트 산출물(scenarios·PurityView·Simulator·테스트 3종)을 메인이 읽고 확인: line 범위가 예제 줄 번호와 일치, 관찰 문장은 "이 예제에서는", 같음/다름은 시각화에서만. 메인 수정 3건: 시나리오 1 단계 제목 "첫/둘째/셋째 Ticket" → "1/2/3번째 Ticket"(시나리오 2·시각화와 통일), 시각화 "1번째 호출 돌려준 JSX" → "호출이 돌려준", 시나리오 2 커밋 설명의 "두 번째 호출 결과가 화면과 같았습니다" 삭제(결과가 같은 예제라 구분 의미 없음). `npx vitest run app/concepts/pure-and-strict-mode` 21 통과. 음성(메인 재실행): pure-strict 1번째 Ticket 2번째 호출 returns를 번호표 2로 바꾸면 3 failed(concept.test 2, PurityView.test 1), 되돌리면 21 통과
- [x] 4. 로드맵 갱신 — 상태 줄 "3번 작성 2026-11-12", 3번 행 JS 연결 `function-calls`·`scope-chain`, React 18 차이 확정 문구. meta `jsPrerequisites`·react18 Callout과 일치
- [x] 5. e2e 케이스 추가 — 서브에이전트. `git diff tests/e2e` +60/−0(삭제 줄 없음), helpers 상수 2개, a11y light·dark 각 1, responsive 2. `--list` 8건(desktop·mobile)
- [x] 6. 전체 검증 — 메인 재실행: lint·format:check·typecheck 통과, vitest 27 files·223 통과, test:build 36 통과(sitemap에 새 경로, `<details` 3 = 퀴즈 3), 빌드 HTML `<code>` 공백 0·`**` 0. e2e navigation+react-examples 30 passed·14 skipped, `-g pure-and-strict-mode` 12 passed·4 skipped(모바일 react-examples skip). 브라우저(빌드 결과를 8890 임시 정적 서버로 띄움, 확인 후 launch.json 원복): 콘솔 에러 0, 시나리오 1은 4~9단계에서 nextNumber 2→7, 5·7·9단계에 "두 결과 다름" 1·2·3개, 10단계 화면 번호표 2·4·6 / 시나리오 2는 "바깥 변수를 쓰지 않습니다", 5·7·9단계 "두 결과 같음", 10단계 1·2·3. 375px·다크에서 두 시나리오 끝까지 가로 넘침 0(창이 가려진 상태의 첫 측정 156px은 innerWidth 0 때문이라 무효)
- [x] 7. L7 자체 점검
  1. 8요소: 소개·목표(meta), 선행(render-and-commit), 원리, 예제 4, 시뮬레이터, 단계 설명, 결과 표+misconception, 참고·관련 링크 — 충족
  2. 근거 링크: react.dev StrictMode(`#fixing-bugs-found-by-double-rendering-in-development`), Keeping Components Pure, useState `#caveats`, 업그레이드 가이드 `#strict-mode-improvements`를 2026-11-12 열어 문장 확인. MDN은 관찰 코드 참고용
  3. 공개 vs 내부: 내부 용어 grep 0건. 1부 공개 동작만
  4. React 18 차이: 업그레이드 가이드 두 문장(useMemo·useCallback 재사용, 마운트 때 ref 콜백 두 번)만 react18 Callout에
  5. JS 링크: `function-calls`, `scope-chain#이름을-찾는-순서` 인덱스에 있음(content-integrity), 문구가 "함수가 바깥 변수를 찾는 방식"과 맞음
  6. 원인 설명: react.dev 정의(순수 함수 두 조건, StrictMode 두 번 호출 대상, 이벤트 핸들러는 렌더 중 실행되지 않음)로 설명
  7. 불확실한 세부 없음: 어느 결과를 화면에 쓰는지, 호출 순서, 경고 없음, 초기값 함수 로그 위치는 "이 예제에서는"+simplifications 4·5·6
  8. 단순화 목록 9개가 개발 빌드, effect·ref, 다른 두 번 호출 대상, 결과 선택, 순서, 경고·배지, DevTools, 일부러 쓴 모듈 변수, 관찰 코드·시뮬레이터 그림을 덮음
  9. jsdom·Chromium 실행 검증 일치, 시뮬레이터 마지막 출력 = expectedOutput(불변식·Simulator.test)
  10. 375px·다크 확인
- 리뷰 1차(critical-code-review, 메인 직접): High 2 (수정, 작업 2) · Medium 0 · Low 0 → 재리뷰(수정 범위) Critical·High 0
  - High(수정): `content.mdx` 동작 원리 "순수하지 않은 함수라면 두 번째 호출의 결과가 첫 번째와 달라져"는 항상 달라지는 것처럼 단정 → "달라질 수 있고, 그러면"
  - High(수정): `content.mdx` 결과와 이유 "StrictMode는 … 경고를 띄우지도 않습니다"는 사용 중단 API 경고를 내는 StrictMode 동작과 어긋나는 일반화 → "이 예제들처럼 두 호출의 결과가 달라도 경고하지 않았습니다"로 한정
  - 수정 후 재실행: format:check·content-integrity 53·test:build 36 통과, 빌드 HTML 새 문장 확인·`<code>` 공백 0, e2e `-g pure-and-strict-mode` 12 passed·4 skipped
- [x] 8. 사용자 검토 의견 반영(2026-11-12) — 근거 재확인: react.dev Keeping Components Pure(입력 세 가지 props·state·context, Recap "렌더는 언제든 일어날 수 있다", Deep Dive `#why-does-react-care-about-purity`의 렌더 건너뛰기·재시작, 부수 효과 정의). 반영: ① 동작 원리에 "프로덕션에서도 순수해야 하는 이유" 문단, misconception Callout 한 문장(실행 수치 없음, 사용자 결정) ② react18 Callout을 18 동작 → 19 변경 순서로 다시 쓰고 useMemo 두 번 호출과 결과 재사용의 관계는 15번 개념으로 넘김(18 실행 순서·내부 구현 없음) ③ 예제 4 해설과 simplifications 5번에 19.3.1 관찰 순서 명시 ④ "같은 JSX = 같은 화면을 나타내는 결과", simplifications 6번에 배지는 JSX 요약 비교 ⑤ simplifications에 context·클래스 메서드 생략 추가 ⑥ "ref 콜백을 두 번 호출" → "한 번 더 실행" ⑦ 부수 효과 정의를 react.dev 표현으로 ⑧ scenarios.ts에 숫자 조사 도우미(`withEul`·`withI`·`withIraseo`·`withRo`) 추가. 메인 재실행: lint·format:check·typecheck 통과, vitest 27 files·223, test:build 36, 빌드 HTML 새 문장 7개 확인·`<code>` 공백 0·`**` 0, e2e `-g pure-and-strict-mode` 12 passed·4 skipped. 개발 서버에서 두 시나리오 4~9단계 설명의 조사 확인(1을·2를·2로·6으로·6이라서·5가 등). 재리뷰(수정 범위): Critical·High 0
- [x] 8-1. 사용자 재검토 반영(2026-11-12) — 근거 재확인: Keeping Components Pure Deep Dive(건너뛰기는 "You can improve performance by skipping…", 재시작은 "restart rendering without wasting time to finish the outdated render"), Render and Commit Deep Dive(업데이트된 컴포넌트 안의 컴포넌트를 모두 렌더하는 것이 기본 동작, 최적화는 opt-in), memo 문서("React normally re-renders a component whenever its parent re-renders", memo는 props가 같을 때 건너뛰기). 반영: ① 동작 원리 새 문단을 "컴포넌트가 순수하면 … 건너뛰어 성능을 높일 수 있고, … React가 낡은 렌더를 끝까지 마치지 않고 다시 시작"으로 고치고 "처음부터" 삭제, "건너뛰기는 기본 동작이 아니라 memo 같은 API로 요청하는 최적화, 기본으로는 돌려준 JSX 안의 컴포넌트도 이어서 호출(2번 개념)" 추가 ② react18 Callout을 "18에서는 두 번째 렌더가 첫 렌더의 useMemo·useCallback 결과를 다시 쓰지 않았고(useMemo는 계산 함수를 다시 실행)"로. 18 실행 세부(useCallback이 몇 번째 호출의 함수를 돌려줬는지)는 쓰지 않음(앞선 기준) ③ references에 memo 문서 추가
- 마무리(2026-11-12, 사용자 최종 승인): content-guide 10단계에 따라 `meta.reviewedAt: '2026-11-12'`. 재실행: lint·format:check·typecheck 통과, vitest 223, test:build 36(sitemap lastmod 2026-11-12, 검토일 배지), e2e `-g pure-and-strict-mode` 12 passed·4 skipped. main에 직접 커밋(앞선 개념과 같은 방식)

## 구현 결과

### 계획 대비 실제 구현
- 작업 순서 1~7을 계획대로 구현했고, 사용자 검토 두 차례를 작업 순서 8·8-1로 반영했다(변경 이력).
- 달라진 점
  - 퀴즈는 계획 6절의 "4개"가 아니라 3개다. 작업 2가 예제 1에 퀴즈를 두지 않도록 정했던 계획 안의 불일치를 바로잡았다.
  - 시뮬레이터(작업 3)와 e2e(작업 5)는 Sonnet 서브에이전트가 만들었고, 메인이 단계 제목 통일("1/2/3번째 Ticket")·시각화 조사·결과가 같은 시나리오의 커밋 설명 문장 하나를 고쳤다.
  - react18 Callout은 Prettier 줄바꿈 공백 때문에 문장 구조를 바꿨고, 사용자 검토로 18 동작 → 19 변경 순서로 다시 썼다.
  - 사용자 검토로 추가: 프로덕션에서도 순수해야 하는 이유(react.dev 근거 문단), "같은 JSX"의 뜻, context·클래스 메서드 생략 표기, 부수 효과 정의, 렌더 건너뛰기는 memo 같은 API로 요청하는 최적화라는 점, references에 memo 문서, 시뮬레이터 숫자 조사 도우미.

### 코드 리뷰
- 자동 리뷰 High 2건(본문의 단정: "결과가 달라져", "경고를 띄우지 않는다")을 고쳤다. 사용자 검토 의견(Major 2·Minor 7·기타)은 모두 반영했고, 수정 범위 재리뷰에서 Critical·High 0이다. 남긴 지적은 없다.

### 후속 작업
- [ ] (계획 9절) `jsx-to-element`·`render-and-commit`의 simplifications("순수 함수와 StrictMode 개념에서 다룹니다")와 `related`를 이 개념으로 연결. 기존 개념 본문 변경이라 다시 검토와 `reviewedAt` 갱신이 필요하다.
- [ ] 로드맵 4번 "props는 읽기 전용이다" 작성

### 이해 확인

#### 설명할 수 있어야 하는 기술적 판단
- [Claude 판단] 리뷰 High 2건은 문장을 지우지 않고 범위를 좁혀 고쳤다. "순수하지 않으면 결과가 달라진다"는 "달라질 수 있고"로, "StrictMode는 경고하지 않는다"는 "이 예제들처럼 두 결과가 달라도 경고하지 않았다"로 바꿨다. StrictMode는 사용 중단 API에는 경고를 내므로 일반 명제로 쓰면 틀리기 때문이다.
- [Claude 판단] 재검토 지적 1을 고치면서 "기본으로는 자식도 이어서 호출한다"는 문장을 8번 개념 대신 이미 공개된 2번 개념("렌더링은 컴포넌트 함수를 호출하는 것")에 연결했다. 근거는 react.dev Render and Commit의 재귀 렌더 문장과 memo 문서다. 버린 대안: 검토안대로 "부모가 다시 렌더되면 자식도"를 쓰는 것(8번 개념을 앞당김).
- [Claude 판단] 시뮬레이터 설명의 숫자 뒤 조사를 숫자의 한국어 받침으로 고르는 도우미(`withEul`·`withI`·`withIraseo`·`withRo`)를 `scenarios.ts`에 두었다. ㄹ 받침(1·7·8)은 '으로'가 아니라 '로'를 쓴다.
- [무검토 승인] StrictMode의 effect·ref 콜백 재실행은 이 페이지에서 다루지 않고 13번·12번 개념으로 넘겼다. 업데이트 함수(`setCount(c => …)`)의 두 번 호출도 예제에서 뺐다. 시제품에서 렌더 전에 StrictMode와 무관해 보이는 호출이 한 번 더 섞였고 react.dev가 이를 설명하지 않기 때문이다(계획 2절).
- [무검토 승인] 관찰과 보장을 나눠 썼다. "화면은 두 번째 호출 값", "한 Ticket을 연달아 두 번", "경고 없음", 예제 4의 로그 순서는 "이 예제에서는"과 simplifications 4·5·6번으로 실행 관찰임을 밝혔다. useState 문서는 두 호출 중 하나를 무시한다고만 적는다.
- [무검토 승인] 예제 1과 2를 같은 `Ticket` 코드로 두고 StrictMode만 달리했다. StrictMode가 버그를 만든 게 아니라 이미 있던 호출 횟수 의존을 드러냈다는 점(misconception Callout)의 근거가 된다. react.dev의 손님·컵 예제는 옮기지 않고 "번호표" 상황으로 새로 썼다.
- 검토 지적 1(프로덕션에서도 순수해야 하는 이유)은 react.dev 문장만으로 쓰고 "4·5·6" 같은 실행 수치는 넣지 않았다. 지적 2의 React 18.3.1 로그 순서와 useCallback 세부도 쓰지 않았다. AGENTS.md가 18 차이를 릴리스 노트·업그레이드 가이드 근거로 제한하기 때문이다(사용자 결정).

#### 배경지식
- react.dev의 순수 컴포넌트 조건: 같은 입력(props·state·context)이면 같은 JSX, 렌더 전부터 있던 변수·객체를 바꾸지 않음. 렌더 중 새로 만든 값의 지역 변경은 괜찮다. 부수 효과(화면 갱신·애니메이션 시작·데이터 변경)는 렌더 곁에서, 보통 이벤트 핸들러에서 일어난다.
- StrictMode는 개발 중에만 순수해야 하는 함수(컴포넌트 본문, useState·set 함수·useMemo·useReducer에 넘긴 함수)를 두 번 호출한다. 이벤트 핸들러는 렌더 중에 실행되지 않으므로 대상이 아니다. 프로덕션 빌드에는 영향이 없다.
- 렌더는 언제든 일어날 수 있고, 순수하면 렌더 건너뛰기(memo 같은 opt-in 최적화)와 렌더 재시작이 가능하다. 그래서 호출 횟수에 기대는 코드는 프로덕션에서도 틀리다.
- React 19 업그레이드 가이드: 두 번째 렌더에서 useMemo·useCallback이 첫 렌더 결과를 다시 쓰고, 처음 마운트할 때 ref 콜백을 한 번 더 실행한다.
- 이 사이트 예제 실행기는 console.error/warn이 나오면 실패하므로, 예제 2가 통과했다는 것 자체가 "결과가 달라도 경고가 없었다"는 관찰이다.

#### 확인 질문
1. 예제 1(StrictMode 없음)은 화면이 1·2·3으로 정상처럼 보이는데, 왜 이 `Ticket`을 "틀린 코드"라고 하나?
   <details><summary>답</summary>결과가 props·state가 아니라 지금까지 호출된 횟수(모듈 변수 nextNumber)에 달려 있다. react.dev는 렌더가 언제든 일어날 수 있고 React가 렌더를 건너뛰거나 다시 시작할 수 있다고 설명하므로, 프로덕션에서도 호출 횟수는 코드가 정할 수 없다. StrictMode는 이를 개발 중에 두 번 호출로 드러낼 뿐이다(content.mdx 동작 원리, misconception Callout).</details>
2. 본문이 "화면에는 두 번째 호출 결과가 쓰인다"고 단정하지 않고 "이 예제에서는"이라고 쓰는 이유는?
   <details><summary>답</summary>react.dev는 두 호출 중 하나의 결과를 무시한다고만 적고 어느 쪽인지 정하지 않는다(useState Caveats). 2·4·6은 19.3.1 실행 관찰이다. 순수한 컴포넌트라면 두 결과가 같아 어느 쪽이든 화면은 같다(simplifications 4번).</details>
3. 예제 4에서 클릭 뒤 `초기값 함수`가 다시 찍히지 않는 이유와, `클릭 핸들러`가 한 번만 찍히는 이유는 각각 무엇인가?
   <details><summary>답</summary>useState의 초기값은 첫 렌더에만 쓰이므로 다시 렌더할 때는 초기값 함수를 부르지 않는다. 이벤트 핸들러는 렌더 중에 실행되지 않으므로 순수할 필요가 없고 StrictMode의 두 번 호출 대상도 아니다(content.mdx 예제 4 해설, StrictMode 문서).</details>
4. "StrictMode는 경고하지 않는다"를 일반 명제로 쓰면 무엇이 틀리나?
   <details><summary>답</summary>StrictMode는 사용 중단 API 사용을 검사해 경고한다(StrictMode 문서의 네 번째 검사). 이 페이지가 관찰한 것은 "두 호출 결과가 달라도 경고하지 않았다"뿐이라 그 범위로 좁혔다(구현 진행 리뷰 1차).</details>
5. 렌더 건너뛰기를 "React가 입력이 같으면 건너뛴다"로 쓰면 어떤 오해가 생기고, 2번 개념과는 어떻게 어긋나나?
   <details><summary>답</summary>"props가 안 바뀌면 React가 알아서 렌더를 건너뛴다"는 오해가 생긴다. 실제 기본 동작은 다시 렌더하는 컴포넌트가 돌려준 JSX 안의 컴포넌트도 이어서 호출하는 것이고(2번 개념, react.dev Render and Commit), 건너뛰기는 memo 같은 API로 요청하는 최적화다(memo 문서, 구현 진행 8-1).</details>


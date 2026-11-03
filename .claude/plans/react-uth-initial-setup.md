# React Under the Hood 초기 구축 구현 계획

- 상태: 완료
- 작성일: 2026-11-02
- 기준: git 저장소 아님(빈 폴더). 뼈대 출처: `github.com/ygvbhy/JS-Under-the-Hood` @ `980716b` (스크래치패드 클론 `/private/tmp/claude-502/-Users-samg-Documents-programming-React-under-the-Hood/49a5307d-6824-4386-bf60-88d1dcf81646/scratchpad/jsuth`)

## 0. 요약
- 목적: JS Under the Hood 뼈대를 가져와 React 19.3.1 학습 사이트의 기반(React 예제 실행기, JS 사이트 링크, 메타 확장, 로드맵)을 만든다.
- 범위: 설정·공통 코드·테스트 인프라·문서 / 개념 콘텐츠 0개(첫 개념은 다음 작업), Sandpack·배포 연결·커밋 제외
- 위험: jsdom 예제 실행 결과가 실제 브라우저와 달라 "실행 검증"이 틀린 근거가 되는 것 → 같은 예제를 Chromium에서도 실행해 대조
- 복잡도: 높음 · Consensus: 수행 (새 패턴(예제 실행기)·공통 타입·테스트 인프라 전반 변경). Architect·Critic 1회 검토 후 HIGH 3건·MEDIUM 5건 반영
- 미확정: 4건

## 1. 요구사항
- 요구사항
  - JS 저장소 뼈대(설정, `app/simulator`, `app/components`, `app/lib`, `app/routes*`, `tests` 인프라, `scripts`, 문서 체계)를 가져오고 JS 개념 콘텐츠(`app/concepts/*`, `.claude/plans/*`)는 가져오지 않는다.
  - 사이트 이름·설명·문서를 React용으로 바꾼다.
  - React 예제 실행기: JSX + react-dom 19.3.1 예제를 실제로 실행해 `console.log` 출력을 `expectedOutput`과 대조한다. jsdom(`npm test`)과 실제 Chromium(e2e 단계) 두 곳에서 검증한다(사용자 선택).
  - `ConceptMeta` 확장: React 카테고리, JS 사이트 선행 개념 링크, 예제 runtime·상호작용.
  - 본문에서 JS 사이트 페이지(앵커 포함)로 링크할 수 있고, 링크 대상이 실제로 있는지 테스트가 검사한다.
  - React 18과 달라진 점을 본문에 표시할 수단(`Callout` 유형).
  - 확정된 개념 27개 목록(부록 A)을 로드맵 문서로 남긴다.
  - `git init`(커밋은 하지 않음, 사용자 선택).
- 유지해야 하는 기존 동작: 개념 1개 = 폴더 1개, 폴더 자동 스캔 라우트, 프리렌더·하이드레이션 규칙, 시뮬레이터 공통 셸과 `Scenario/Step` 타입, 예측 퀴즈, `reviewedAt` 검토 게이트, 검증 순서, 의존성 정확 고정 규칙.
- 제외 범위: 개념 페이지 작성(첫 개념은 다음 계획), Sandpack 도입, GitHub 저장소 생성·Vercel 연결, 커밋, 새 의존성 추가.

## 2. 사실과 추정
### 사실 (경로는 JS 저장소 @980716b 기준)
- 스택이 이미 React 19.3.1·React Router 8.5.0·Vite 8.3.4·Vitest 5.0.5·@playwright/test 1.64.1·jsdom 30.1.3이며 모두 정확 고정 — `package.json`. 예제 실행기에 새 의존성이 필요 없다.
- 라우트는 `app/concepts/*/route.tsx`를 서버 시작 시 스캔한다 — `app/routes.ts:5-9`. 폴더가 없으면 `readdirSync`가 throw하고, git은 빈 폴더를 추적하지 않는다. `routes.ts`·`tests/content-integrity.test.ts`·`tests/build/build-output.test.ts`는 디렉터리만 센다.
- 현재 예제 실행기는 Node `vm` 스크립트(import/JSX/DOM 불가) — `tests/helpers/run-example.ts:1-17`, 사용처 `tests/examples.test.ts:8-16`, 단위 테스트 `tests/run-example.test.ts`. `ConceptMeta.examples[].runtime`은 `'ecmascript'`만 — `app/lib/concepts.ts:13-18`.
- 카테고리 타입 `app/lib/concepts.ts:1`, `CATEGORY_LABELS` `:24-30`(선언 순서 = 홈 그룹 순서, `app/lib/concept-groups.ts:11-18`). 옛 카테고리 값을 쓰는 스텁: `app/lib/seo.test.ts:71`, `app/lib/concept-groups.test.ts:31`, `app/lib/concepts.test.ts:16`.
- 선행 개념은 같은 사이트 slug만 링크 — `app/components/concept/PrerequisiteList.tsx:6-37`. MDX `a`는 `https?://`를 새 창 링크로 그린다 — `app/components/concept/MdxElements.tsx:41-63`. `Callout` 유형은 note/warning/misconception — `Callout.tsx:3-9`.
- JS 사이트 제목 앵커 id는 `slugify(제목 텍스트)` — `app/lib/slugify.ts`, `MdxElements.tsx:22`. 배포 페이지 `h2/h3`에 실제 id가 있음을 확인(예: `/concepts/closure`의 `호출마다-새-환경`).
- JS 문구·URL이 박힌 곳: `app/lib/site.ts:1-9`, `scripts/postbuild.mjs:7`(기본 URL), `app/routes/about.tsx:22,47,51,60`, `app/components/site/SiteFooter.tsx:11`, `tests/e2e/navigation.spec.ts:57`(h1 이름 `'JS Under the Hood'`), `README.md`, `AGENTS.md`, `docs/content-guide.md`, `.env`, `public/og-default.png`(`scripts/generate-og.mjs`가 `site.ts`에서 생성).
- 개념에 묶인 테스트: `app/components/concept/ConceptPager.test.tsx`(실제 slug), `app/lib/concepts.test.ts:68-83`·`:98-`(레지스트리 사용), `app/components/site/ConceptCard.test.tsx:8`(`listConcepts()[0]`), `tests/content-integrity.test.ts:24-26`, `tests/build/build-output.test.ts:85`부터의 개념별 describe(수집 시점에 `read()`를 호출하므로 반드시 삭제), `tests/e2e/*`(작업 순서 5의 목록).
- 홈은 결과가 0개일 때 "학습 순서" h3를 그리지 않는다 — `app/routes/home.tsx:141`. 빈 상태 문구 — `home.tsx:79`.
- 개념 0개 실험(스크래치패드): `npm run build` 성공(홈·소개·404, sitemap 2개 URL), `typecheck` 통과. 실패: content-integrity "개념이 하나 이상", concepts.test 레지스트리 케이스, `tests/examples.test.ts`("No test suite found in file": 파일에 빈 `describe.each`만 있으면 파일 오류). 같은 파일에 다른 테스트가 있으면 빈 `describe.each/it.each`는 오류가 아니다.
- 실행기 스파이크(React 19.3.1 개발 빌드): 4개 예제를 (a) jsdom + 실제 스케줄러(act 없음), (b) jsdom + `act()`, (c) Vite 개발 빌드 + Playwright Chromium 실제 클릭으로 실행 → `console.log` 순서가 셋 다 같았다. `.jsx`는 별도 설정 없이 자동 JSX 런타임으로 변환된다. Chromium 개발 빌드는 `info` 타입 "Download the React DevTools" 메시지를 낸다.
- (Architect 실험) `vi.resetModules()`는 react·react-dom·scheduler를 다시 로드하지 않는다(외부화된 CJS, Node 캐시). 예제 모듈만 다시 실행되고 React 모듈 상태·이전 root는 같은 테스트 파일 안에서 공유된다. 개발 경고의 중복 제거 상태도 공유된다(key 경고가 2회차에 사라짐).
- (Architect 실험) `vite.build({ configFile: false, mode: 'development' })`만으로는 프로덕션 React가 나온다. `define: { 'process.env.NODE_ENV': '"development"' }`가 있어야 개발 빌드다.
- (Architect 실험) `playwright.config.ts:10`의 `fullyParallel: true`에서 `beforeAll`은 워커마다 실행된다(desktop·mobile 워커 4개가 각각 빌드). `test.describe.configure({ mode: 'default' })` + `beforeAll` 안의 `test.skip(testInfo.project.name !== 'desktop')` + `strictPort` + `afterAll` 서버 종료 조합에서 desktop 워커 하나만 빌드했다. Playwright 스펙 안에서 `import('vite')`의 build·preview와 `app/concepts/*/meta.ts` 동적 import가 동작한다.
- (Architect 실험) node 프로젝트(`tests/*.test.ts`) 파일에 `// @vitest-environment jsdom` docblock을 쓰면 jsdom 환경으로 실행된다. jsdom에서 클릭 핸들러의 처리되지 않은 예외는 console.error로 잡힌다. Chromium에서는 `pageerror` 이벤트로만 온다.
- (Critic 실험) Prettier는 `JSON.stringify(_, null, 2)`로 펼친 짧은 배열을 한 줄로 접으므로, 스크립트가 쓴 JSON은 그대로면 `format:check`에서 실패한다. `.prettierignore`에 `app/lib`는 없다.
- `git archive 980716b -- . ':(exclude)app/concepts' ':(exclude).claude/plans'`로 제외 조건과 함께 추적 파일만 꺼낼 수 있다(`spike/`는 추적 파일이 아니라 포함되지 않음).

### 추정
- jsdom과 Chromium이 4개 예제에서 같았다고 모든 예제에서 같다고 볼 수 없다(스케줄러가 Node에서는 setImmediate, 브라우저에서는 MessageChannel을 쓸 것으로 추정) — 작업 순서 3의 Chromium 교차 검증이 확인한다.
- 실사이트 sitemap의 개념 slug는 29개일 것(저장소 폴더 29개) — 작업 순서 4에서 sync 결과로 확인.
- facebook/react에 `v19.3.1` 태그가 있을 것 — 작업 순서 7에서 문서에 링크 형식을 쓰기 전에 확인하고, 없으면 해당 릴리스 커밋 해시 고정 링크로 쓴다.

## 3. 구현 전략
- 뼈대는 `git archive`로 추적 파일만 가져온다. `app/concepts/.gitkeep`으로 빈 폴더를 유지한다.
- 예제 실행기는 **act 없이 실제 스케줄러**로 jsdom에서 실행한다. act는 업데이트를 범위 끝에서 모아 처리해 브라우저와 다른 시점을 만들 수 있고, act 밖 업데이트에 경고를 낸다. 스파이크에서 결과가 같았으므로 브라우저에 가까운 쪽을 고른다.
  - 예제 파일 = 사용자가 보는 완전한 React 프로그램(`createRoot(document.getElementById('root')).render(...)`까지). 사용자 조작은 예제 코드에 넣지 않고 `meta.examples[].interactions`로 실행기가 수행한다.
  - 예제마다 `#root`를 새로 만들고 `vi.resetModules()` 후 예제 모듈을 동적 import한다. **React 모듈 상태는 같은 테스트 파일 안에서 공유된다**(사실 항목). 지금은 console.error/warn이 하나라도 나면 실패하는 규칙이라 개발 경고 중복 제거 공유의 영향이 없다. 경고를 기대 출력으로 다루게 되면(미확정 3) 예제별 프로세스 격리가 필요하다.
  - 출력: `console.log` 인수를 `String`으로 바꿔 공백으로 잇는다. 첫 인수 문자열에 `%`가 있으면 throw하지 않고 errors에 위반을 기록한다(렌더 안 throw는 React 오류 흐름으로 바뀌어 원인이 흐려지므로). errors에는 console.error/warn과 window `error`·`unhandledrejection` 이벤트도 모은다.
  - settle: `setTimeout(0)` 20회 대기 후 5회 더 대기해 출력·errors가 늘면 errors에 "settle되지 않음"을 기록. 이 검사는 수십 ms 이상 지연 타이머를 잡지 못하므로 실질 방어는 문서 규칙(지연 타이머 금지)과 Chromium 교차 검증이다.
- 픽스처와 개념 예제는 **하나의 케이스 수집 함수**(`collectReactExampleCases`)를 거쳐 jsdom 테스트와 Chromium 스펙이 같은 목록·같은 코드 경로를 쓴다. 개념 쪽은 `app/concepts/*/meta.ts`를 `fs` 스캔 + 동적 import로 읽는다(Playwright는 `import.meta.glob`을 못 쓰므로 둘 다 이 방식).
- Chromium 교차 검증은 Playwright 스펙으로 만든다. 새 의존성 없이 `vite.build`(`configFile: false`, development `define`)로 예제마다 HTML을 묶고 `vite.preview`로 띄워 실제 클릭으로 조작한다. 버린 대안: Vitest browser mode(새 의존성 `@vitest/browser-playwright`, 격리 동작 미확인).
- 기존 `'ecmascript'` runtime과 `run-example.ts`는 제거한다. 순수 JS 동작은 JS 사이트로 링크하는 방향이고, jsdom 실행기가 순수 JS 모듈 예제도 실행할 수 있다.
- JS 사이트 링크 검증은 **스냅샷 파일**로 한다. `scripts/sync-js-index.mjs`가 sitemap과 각 개념 페이지에서 slug와 `h2/h3` id를 모아 `app/lib/js-site-index.json`에 쓰고 Prettier로 포맷한다(수동 실행). 테스트는 네트워크 없이 이 파일로 검사한다. 본문의 JS 사이트 링크는 `<JsLink>`만 허용하고, `content.mdx`에 JS 사이트 URL이 직접 나오면 테스트가 실패한다. 버린 대안: 테스트마다 실사이트 fetch(네트워크 의존), 로컬 JS 저장소 경로 의존(환경마다 다름).
- 개념 0개에서 성립하지 않는 테스트는 작업 순서 5의 목록대로 지우고, 그 목록을 "구현 진행"에 남겨 첫 개념 작업에서 다시 추가한다(사용자 선택).

## 4. 변경 파일
("가져옴"은 JS 저장소에서 그대로)
- 가져옴(변경 없음): `.nvmrc`, `.prettierrc`, `.prettierignore`, `.gitignore`, `CLAUDE.md`(`@AGENTS.md`), `.claude/launch.json`, `react-router.config.ts`, `vite.config.ts`, `vitest.config.ts`, `vitest.build.config.ts`, `playwright.config.ts`, `serve.json`, `vercel.json`, `tsconfig.json`, `eslint.config.js`, `app/root.tsx`, `app/routes.ts`, `app/app.css`, `app/routes/home.tsx`, `app/routes/not-found.tsx`, `app/simulator/*`, `app/lib/{concept-groups,seo,slugify,useHydrated}.ts`와 그 테스트(스텁 수정 제외), `app/components/concept/*`·`app/components/site/*`(아래 수정 제외), `tests/setup.ts`, `tests/helpers/scenario-invariants.ts`, `tests/scenario-invariants.test.ts`, `scripts/generate-og.mjs`, `public/favicon.svg`
- 수정
  - `package.json`·`package-lock.json`: `name`을 `react-under-the-hood`, 스크립트 `"js-index:sync": "node scripts/sync-js-index.mjs"` 추가. 의존성 변경 없음. lock은 `npm install --package-lock-only`로 name만 갱신.
  - `.env`: `VITE_SITE_URL=http://localhost:4173`과 주석("배포 도메인이 정해지면 교체", 미확정 1).
  - `app/lib/site.ts`: `SITE_NAME='React Under the Hood'`, `SITE_DESCRIPTION='React 코드가 왜 그렇게 동작하는지 눈으로 확인하는 인터랙티브 학습 사이트'`, 기본 URL `http://localhost:4173`.
  - `scripts/postbuild.mjs:7`: 기본 URL `http://localhost:4173`(site.ts와 같게).
  - `app/lib/concepts.ts`: 카테고리·`jsPrerequisites`·examples 타입.
  - `app/components/concept/{PrerequisiteList,ConceptLayout,Callout,mdx-components}.tsx`
  - `app/routes/about.tsx`, `app/components/site/SiteFooter.tsx`: 정확성 정책 문구.
  - 테스트: `tests/content-integrity.test.ts`, `tests/build/build-output.test.ts`, `app/lib/concepts.test.ts`, `app/lib/seo.test.ts`, `app/lib/concept-groups.test.ts`, `app/components/site/ConceptCard.test.tsx`, `app/components/concept/PrerequisiteList.test.tsx`, `tests/e2e/{helpers.ts,a11y.spec.ts,navigation.spec.ts,responsive.spec.ts}`
  - `README.md`, `AGENTS.md`, `docs/content-guide.md`: React 기준으로 재작성.
  - `public/og-default.png`: `npm run og:generate`로 재생성.
- 추가
  - `app/concepts/.gitkeep`
  - `tests/helpers/run-react-example.ts`, `tests/helpers/react-example-cases.ts`, `tests/react-examples.test.ts`
  - `tests/fixtures/react-examples/{strict-mode,click-batching,microtask-order,effect-set-state,percent-in-render}.jsx`, `tests/fixtures/react-examples/cases.ts`
  - `tests/e2e/react-examples.spec.ts`
  - `app/lib/js-site.ts`, `app/lib/js-site-index.json`, `scripts/sync-js-index.mjs`, `app/components/concept/JsLink.tsx`
  - `.claude/plans/concept-roadmap.md`
- 가져오지 않음(삭제): `tests/helpers/run-example.ts`, `tests/run-example.test.ts`, `tests/examples.test.ts`, `app/components/concept/ConceptPager.test.tsx`, `tests/e2e/concept.spec.ts`, `tests/e2e/no-js.spec.ts`

## 5. 위험 요소
- jsdom과 브라우저의 스케줄링·이벤트 차이 → `expectedOutput`이 브라우저와 다른데 `npm test` 통과 → 작업 순서 3(같은 케이스를 Chromium에서 실행해 같은 기대값과 대조).
- React 모듈 상태가 예제 사이에 공유 → 앞 예제의 개발 경고 중복 제거·남은 root가 뒤 예제에 영향 → 지금은 error/warn이 있으면 실패 규칙으로 영향 없음. Chromium은 페이지마다 새 React라 차이가 나면 교차 검증에서 드러남. `expectedErrors` 도입 시 프로세스 격리를 같이 정한다(미확정 3).
- 렌더·effect·핸들러 안 예외가 React에 가로채져 실행기 결과에 안 잡힘 → jsdom은 console.error와 window `error`/`unhandledrejection` 수집, Chromium은 `pageerror` 수집, 둘 다 errors가 비어야 통과(작업 순서 2, 3).
- 지연 타이머·끝나지 않는 비동기 예제 → 대기 시간에 따라 결과가 달라짐 → settle 검사(짧은 지연만), 문서 금지 규칙(작업 순서 7), Chromium의 다른 대기 방식과의 교차 검증.
- `%` 서식 지정자 해석 차이(Chromium `msg.text()`) → 실행기 위반 기록(작업 순서 2), 문서 규칙(작업 순서 7).
- Chromium 스펙의 워커별 중복 빌드·포트 충돌·서버 누수 → `mode: 'default'`, `beforeAll` 안 project skip, `strictPort: true`, `afterAll` 종료, `test.setTimeout`(작업 순서 3).
- 프로덕션 React로 실행되면 개발 전용 동작(StrictMode 이중 실행)이 사라짐 → Vitest는 NODE_ENV=test로 개발 빌드, Chromium은 `define` 고정과 "Download the React DevTools" `info` 단언(작업 순서 3).
- 개념 예제 경로가 개념 0개라 실행되지 않음 → 공통 케이스 수집 함수 + 작업 순서 3 완료 조건의 임시 스텁 개념 확인.
- 빈 `app/concepts`가 git에 없으면 클론·Vercel 빌드에서 `routes.ts` throw → `.gitkeep`(작업 순서 1).
- 개념 0개 기간의 커버리지 공백(페이저·이웃 개념·개념 페이지 e2e) → 삭제 목록을 "구현 진행"에 기록, 첫 개념 계획의 필수 단계(작업 순서 5).
- 카테고리 값 변경 → 스텁·타입 불일치 → `npm run typecheck`(작업 순서 4).
- JS 사이트 제목이 바뀌면 스냅샷이 낡아 실제 링크가 깨질 수 있음 → "JS 링크를 추가·수정할 때 `npm run js-index:sync` 먼저" 규칙(작업 순서 7), 추가 개선 후보.
- 본문 마크다운 링크로 JsLink 검사 우회 → JS 사이트 URL 직접 사용 금지 테스트(작업 순서 4).
- 프로젝트의 react 버전을 올리면 예제 기준 버전도 바뀜 → AGENTS.md 규칙(작업 순서 7).

## 6. 검증 방법
- 정적: `npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:build && npm run e2e` 전부 통과.
- 실행기 음성 검사: 픽스처 하나의 기대값을 일부러 틀리게 바꾸면 jsdom 테스트와 Chromium 스펙이 둘 다 실패하는지 확인 후 되돌린다.
- 브라우저(`npm run dev`):
  1. `/`: h1 "React Under the Hood", 설명 문구, "아직 등록된 개념이 없습니다.", 콘솔 에러 없음.
  2. `/about`: 정확성 정책에 ECMAScript 문구가 없고 react.dev·React 19.3.1 소스·실제 실행 결과 기준 문구, 공개 동작/내부 구현 구분 문구가 있으며 `#accuracy` 앵커가 있다.
  3. 푸터 문구가 React 기준.
  4. `/없는-경로`: 404 페이지, 홈으로 돌아가기.
  5. 375px 폭·다크 모드에서 홈·소개 가로 스크롤 없음.

## 7. 미확정 사항
- [미확정] 배포 도메인: 정해질 때까지 `.env`·`site.ts`·`postbuild.mjs` 기본 URL은 `http://localhost:4173`. 배포 시 Vercel 환경변수로 덮어쓰고 세 곳을 갱신한다.
- [확정 2026-11-02, 계획 승인] 카테고리 이름·분류: `rendering` 렌더링 기초(1·2·3·4·8), `state` state와 업데이트(5·6·7·9·10), `effects` 이벤트·ref·effect(11·12·13·14), `optimization` 메모이제이션과 Context(15·16), `internals` 내부 구현(17~22·26), `concurrency` 동시성(23·24·25·27).
- [미확정] `console.error`(예: 10번 key 경고)를 기대 출력으로 다룰지는 그 개념 계획에서 정한다. 도입하면 예제별 프로세스 격리가 필요하다. 지금은 error/warn이 있으면 실패.
- [미확정] 텍스트 입력 등 클릭 외 조작은 필요한 개념이 생길 때 `interactions` 유형을 추가한다. 지금은 `click`만.

## 8. 작업 순서
### 1. 프로젝트 초기화와 뼈대 가져오기
- 대상: 프로젝트 루트
- 현재: 빈 폴더(이 계획 문서만 있음), git 아님
- 변경: `git init -b main`. 스크래치패드 클론에서 `git -C <클론> archive 980716b -- . ':(exclude)app/concepts' ':(exclude).claude/plans' | tar -x -C <프로젝트>`. `app/concepts/.gitkeep` 생성. `npm ci`.
- 이유: 추적 파일만 정확히 가져오고 빈 개념 폴더를 git에 남기기 위해
- 주의사항: 커밋하지 않는다. 이 계획 문서(`.claude/plans/react-uth-initial-setup.md`)를 덮어쓰지 않는다(archive가 `.claude/plans`를 제외하므로 안전).
- 완료 조건: `git status`가 동작하고 브랜치가 main, `ls -A app/concepts`가 `.gitkeep`만, `ls .claude/plans`가 이 문서뿐, `npm ci` 성공, `npm run build` 성공.

### 2. React 예제 실행기(jsdom)와 examples 타입
- 대상: `app/lib/concepts.ts`(examples 타입만), `tests/helpers/run-react-example.ts`, `tests/helpers/react-example-cases.ts`, `tests/react-examples.test.ts`, `tests/fixtures/react-examples/*`; 삭제 `tests/helpers/run-example.ts`, `tests/run-example.test.ts`, `tests/examples.test.ts`
- 현재: vm 스크립트 실행기, runtime `'ecmascript'`
- 변경:
  - 타입: `examples: { id: string; file: string /* examples/ 아래 .jsx */; runtime: 'react-dom'; interactions?: { type: 'click'; selector: string }[]; expectedOutput: string[] }[]`.
  - `react-example-cases.ts`: `type ReactExampleCase = { name: string; absPath: string; interactions: {type:'click';selector:string}[]; expectedOutput: string[] }`. `collectReactExampleCases(): Promise<ReactExampleCase[]>` = 픽스처(`tests/fixtures/react-examples/cases.ts`의 `chromium: false`가 아닌 것 포함 전체, 아래 참고) + `app/concepts/*/meta.ts`를 `readdirSync` 스캔해 동적 import한 각 예제(`name` = `<slug>/<id>`, `absPath` = `app/concepts/<slug>/examples/<file>`). 프로젝트 루트는 `process.cwd()`.
  - `cases.ts`: 각 픽스처 `{ name, file, interactions, expectedOutput, errors?: 'expect-violation' }`. `percent-in-render`만 `errors: 'expect-violation'`(Chromium 스펙 제외 대상).
  - `runReactExample(absPath, interactions = [])`: `Promise<{ output: string[]; errors: string[] }>`. 절차: `globalThis.IS_REACT_ACT_ENVIRONMENT = false` → `document.body.innerHTML = '<div id="root"></div>'` → `vi.resetModules()` → console.log/error/warn spy와 window `error`·`unhandledrejection` 리스너 등록 → `await import(/* @vite-ignore */ absPath)` → settle → interactions마다 `document.querySelector(selector)`(없으면 errors에 기록 후 중단)`.click()` 후 settle → spy·리스너 해제 → 반환. log는 `args.map(String).join(' ')`, 첫 인수가 `%`를 포함한 문자열이면 errors에 `"%"는 쓸 수 없습니다: <원문>` 기록. settle = `setTimeout(0)` 20회 → 출력·errors 길이 저장 → 5회 더 → 늘었으면 errors에 "settle되지 않음" 기록.
  - `tests/react-examples.test.ts`: 첫 줄 `// @vitest-environment jsdom`. (a) 픽스처 중 `errors` 표시 없는 것: `output`이 `expectedOutput`과 같고 `errors`가 `[]`. (b) `percent-in-render`(렌더 함수 안에서 `console.log('50%')`): errors에 `%` 위반이 있다. (c) 픽스처 하나를 연속 두 번 실행해 출력이 같다(예제 모듈 재실행 확인 목적. React 상태 격리를 보장하지는 않음을 주석으로). (d) 개념 예제: `collectReactExampleCases()`의 개념 항목마다 (a)와 같은 단언(개념 0개면 0건이지만 파일에 (a)~(c)가 있어 파일 오류 없음).
  - 픽스처 4개 코드는 스파이크 파일(`.../scratchpad/jsuth/spike/examples/{strict,batch,micro,effect-setstate}.jsx`)과 같고 기대값은 스파이크 Chromium 결과: strict-mode `['after render call','render','render','effect','cleanup','effect']`, click-batching(`button` 클릭 1회) `['render 0','clicked 0','render 1']`, microtask-order(`button` 클릭 1회) `['render 0','layout 0','effect 0','handler end','microtask','render 1','layout 1','effect 1','timeout']`, effect-set-state `['sync end','render false','effect false','render true','effect true']`.
- 이유: React 예제의 "실제 실행 결과" 검증 기반
- 주의사항: 이 테스트 파일은 node 프로젝트(`tests/*.test.ts`)에 잡히지만 docblock으로 jsdom 환경을 쓴다. 이 단계에서 `ConceptMeta`의 다른 필드는 바꾸지 않는다.
- 완료 조건: `npx vitest run tests/react-examples.test.ts` 통과. 픽스처 하나의 기대값을 바꾸면 실패(확인 후 되돌림).

### 3. Chromium 교차 검증 스펙
- 대상: `tests/e2e/react-examples.spec.ts`
- 현재: 없음
- 변경:
  - `test.describe.configure({ mode: 'default' })`. `beforeAll(async ({}, testInfo) => …)` 첫 줄 `test.skip(testInfo.project.name !== 'desktop', 'Chromium 교차 검증은 desktop에서 한 번만')`, `test.setTimeout(120_000)`.
  - `beforeAll`: `collectReactExampleCases()`에서 `errors` 표시 없는 케이스마다 `test-results/react-examples/src/<번호>.html`(`<!doctype html><html><body><div id="root"></div><script type="module" src="/<프로젝트 루트 기준 예제 경로>"></script></body></html>`) 생성 → `vite.build({ configFile: false, root: 프로젝트 루트, mode: 'development', logLevel: 'error', define: { 'process.env.NODE_ENV': '"development"' }, build: { outDir: 'test-results/react-examples/dist', emptyOutDir: true, minify: false, rollupOptions: { input } } })` → `vite.preview({ configFile: false, root: 프로젝트 루트, build: { outDir: 'test-results/react-examples/dist' }, preview: { port: 4174, strictPort: true } })`. 주석: "define이 없으면 mode와 상관없이 프로덕션 React가 묶인다".
  - `afterAll`: preview 서버 종료.
  - 케이스마다 하나의 `test`(이름 = 케이스 name): 새 페이지에서 `console`과 `pageerror` 수집 → 이동 → "300ms 동안 새 콘솔 메시지가 없을 때까지(최대 5초)" 대기 → `interactions`마다 `page.click(selector)` 후 같은 대기 → `log` 타입 텍스트 배열이 `expectedOutput`과 같다, `error`·`warning` 타입과 `pageerror`가 없다, "Download the React DevTools" `info`가 있다.
  - 케이스 목록은 `beforeAll` 전에 테스트를 정의해야 하므로 스펙 최상위에서 `await collectReactExampleCases()`(Playwright ESM 최상위 await)로 받는다. 안 되면 `fs` 동기 스캔 + `createRequire` 대신 같은 함수의 동기 버전을 helper에 추가한다(둘 중 동작하는 쪽, 구현 진행에 기록).
- 이유: jsdom과 브라우저 차이를 잡기 위해(사용자 선택)
- 주의사항: `configFile: false`가 없으면 React Router 플러그인이 로드된다. `test-results/`는 gitignore·Prettier 제외 대상.
- 완료 조건: `npx playwright test tests/e2e/react-examples.spec.ts` 통과(mobile은 skip, 빌드 로그 1회). 픽스처 기대값을 바꾸면 실패(확인 후 되돌림). 임시 스텁 개념(`app/concepts/zz-runner-check/meta.ts` + `examples/a.jsx`, 픽스처 click-batching과 같은 코드·기대값)을 만들어 `npx vitest run tests/react-examples.test.ts`와 이 스펙에서 `zz-runner-check/a`가 실행·통과하는 것을 확인한 뒤 폴더를 삭제한다.

### 4. ConceptMeta 확장과 JS 사이트 링크
- 대상: `app/lib/concepts.ts`, `app/lib/js-site.ts`, `app/lib/js-site-index.json`, `scripts/sync-js-index.mjs`, `package.json`(스크립트), `app/components/concept/{PrerequisiteList,ConceptLayout,Callout,JsLink,mdx-components}.tsx`, `tests/content-integrity.test.ts`, `tests/build/build-output.test.ts`, 스텁 테스트
- 현재: 카테고리 JS용, 외부 선행 개념 없음
- 변경:
  - `ConceptCategory`·`CATEGORY_LABELS`를 미확정 2의 6개로(선언 순서 = 홈 그룹 순서).
  - `ConceptMeta`에 `jsPrerequisites: { label: string; slug: string; anchor?: string }[]`(필수, 없으면 `[]`).
  - `js-site.ts`: `JS_SITE_NAME = 'JS Under the Hood'`, `JS_SITE_URL = 'https://js-under-the-hood-kappa.vercel.app'`, `jsConceptUrl(slug, anchor?)` = `${JS_SITE_URL}/concepts/${slug}` + (`anchor` ? `#${anchor}` : '').
  - `sync-js-index.mjs`: `${JS_SITE_URL}/sitemap.xml`에서 `/concepts/<slug>` 추출 → 각 페이지 HTML에서 `<h2|h3[^>]* id="([^"]+)"` 수집 → `{ source: JS_SITE_URL, syncedAt: 'YYYY-MM-DD', concepts: { [slug]: string[] } }`(slug 키 정렬)를 쓰고 `npx prettier --write`로 포맷. JS_SITE_URL은 `js-site.ts`를 정규식으로 읽어 한 곳에서 관리(`generate-og.mjs`의 `readConstant` 방식).
  - `PrerequisiteList`: `jsPrerequisites` prop 추가, 둘 중 하나라도 있으면 섹션 표시. JS 항목은 같은 칩 스타일의 외부 링크(`target="_blank" rel="noopener noreferrer"`, 텍스트 뒤 sr-only " (JS Under the Hood, 새 창)"). `ConceptLayout`이 전달.
  - `JsLink`(`mdx-components`에 등록, MDX에서 import 없이 사용): `<JsLink slug="closure" anchor="호출마다-새-환경">클로저</JsLink>` → `Anchor`와 같은 외부 링크.
  - `Callout`에 `react18` 유형(라벨 "React 18에서는", 상자 `border-border bg-surface`).
  - content-integrity: (개념 0개여도 실행) 인덱스 형식 검사(`concepts`가 slug → 문자열 배열 객체, 1개 이상). (개념별) `jsPrerequisites`의 slug가 인덱스에 있고 anchor가 그 id 목록에 있다. `content.mdx`의 `<JsLink slug="…"( anchor="…")?`(속성 순서 slug→anchor 고정)도 같은 검사. `content.mdx`에 `js-under-the-hood-kappa.vercel.app`가 나오면 실패. 예제 `file`이 `.jsx`로 끝난다.
  - build-output: '선행 개념' h2 조건을 `prerequisites.length + jsPrerequisites.length > 0`으로.
  - 스텁 갱신: `seo.test.ts`·`concept-groups.test.ts`·`concepts.test.ts`의 카테고리 값과 `jsPrerequisites: []`. `PrerequisiteList.test.tsx`에 JS 항목의 href(`jsConceptUrl` 결과)·`target="_blank"` 케이스 추가.
- 이유: JS 사이트 연결과 React 18 비교 표시 요구사항
- 주의사항: `meta.ts`는 타입 외 import 금지 규칙 유지(인덱스 JSON은 테스트만 import).
- 완료 조건: `npm run js-index:sync`가 JSON을 만들고 `concepts`에 실사이트 sitemap의 개념 수(예상 29)만큼 slug, `closure` 배열에 `호출마다-새-환경`이 있다. `npm run typecheck`, `npx vitest run app tests/content-integrity.test.ts`, `npm run format:check` 통과.

### 5. 개념 0개 대응 테스트 정리
- 대상: 아래 파일
- 현재: JS 개념 slug·개수에 의존
- 변경:
  - `tests/content-integrity.test.ts`: "개념이 하나 이상 있다" 삭제.
  - `app/lib/concepts.test.ts`: 레지스트리 의존 케이스(`:68-83`, `:98-` 이하 `listConcepts`·`getConcept`·`getAdjacentConcepts`) 삭제, 스텁 기반 케이스 유지.
  - `app/components/concept/ConceptPager.test.tsx`: 가져오지 않음.
  - `app/components/site/ConceptCard.test.tsx`: `listConcepts()[0]` 대신 스텁 `ConceptMeta`(단언 그대로).
  - `tests/build/build-output.test.ts`: `:85` 이후 "시뮬레이터 프리렌더 (…)", "프리렌더 (…)" describe 전부 삭제. 홈·소개·404·OG·JSON-LD·sitemap 공통 describe와 '학습 순서 pager'(`:882`, `it.each`라 빈 목록 허용)는 유지.
  - `tests/e2e/helpers.ts`: `*_PATH`, `*_SIMULATOR_NAME` 상수 삭제, `collectConsoleErrors`·`waitForHydration`·`ConsoleErrors` 유지.
  - `tests/e2e/navigation.spec.ts`: 유지 — `/?q=zzz`(`:36`), 404(`:46`, 단 `:57`의 `'JS Under the Hood'`를 `SITE_NAME` import로 바꾸는 유일한 단언 변경), `?view=order&q=zzz`(`:126`). 삭제 — `:5`, `:26`, `:61`, `:113`, `:140`.
  - `tests/e2e/a11y.spec.ts`: 유지 — '홈', '홈: 검색 결과 / 결과 없음'(결과 0개여도 axe만 검사), '홈: 보기 방식 키보드 조작', 'axe (기본 색상 모드)'의 소개·404. 삭제 — '홈: 학습 순서 보기'(h3 단언), '개념 페이지'로 시작하는 모든 테스트.
  - `tests/e2e/responsive.spec.ts`: `:56` 경로 배열에서 `CONCEPT_PATH` 제거(`['/', '/about', '/404']`). 삭제 — 개념 경로를 여는 모든 테스트, `:728` 하단 내비게이션 루프, `:791` '홈 학습 순서 보기'(article 29개 단언).
  - `tests/e2e/concept.spec.ts`, `tests/e2e/no-js.spec.ts`: 가져오지 않음(남는 테스트 없음).
  - 삭제한 테스트 이름을 이 문서 "구현 진행"에 파일별로 기록.
- 이유: 개념 0개에서 검증 순서 전체가 통과해야 함(사용자 선택)
- 주의사항: 위에 명시한 `:57` 외에 남기는 테스트의 단언은 바꾸지 않는다.
- 완료 조건: `npm test`, `npm run test:build`, `npx playwright test` 통과. "구현 진행"에 삭제 목록 존재.

### 6. 사이트 정체성
- 대상: `package.json` name·lock, `.env`, `app/lib/site.ts`, `scripts/postbuild.mjs`, `app/routes/about.tsx`, `app/components/site/SiteFooter.tsx`, `README.md`, `public/og-default.png`
- 변경: 4절 값으로. 소개 페이지 정확성 정책: 근거 = react.dev 문서·React 19.3.1 소스·실제 실행 결과 / 공개 동작(react.dev가 보장)과 내부 구현(19.3.1 구현 기준, 버전마다 바뀔 수 있음)을 구분 / 시각화는 교육용 모델이고 단순화는 페이지에 명시 / 자바스크립트 언어 동작은 JS Under the Hood로 연결. `#accuracy` 앵커 유지. 푸터: "콘텐츠는 react.dev 문서, React 19.3.1 소스 코드와 실제 실행 결과를 기준으로 작성됩니다." README: 사이트 소개·스크립트 표(`js-index:sync` 추가)를 React 기준으로. `npm run og:generate`.
- 완료 조건: `grep -rn "ECMAScript" app scripts tests README.md .env package.json` 결과 없음. `grep -rn "js-under-the-hood-kappa" app scripts tests README.md .env package.json`이 `app/lib/js-site.ts`, `app/lib/js-site-index.json`, content-integrity의 URL 금지 검사에서만 나온다. `grep -rn "JS Under the Hood"`가 `js-site.ts`, PrerequisiteList sr 텍스트, 소개의 JS 연결 문장, README의 관계 설명에서만 나온다. og 이미지 검사(build-output) 통과.

### 7. 문서와 로드맵
- 대상: `AGENTS.md`, `docs/content-guide.md`, `.claude/plans/concept-roadmap.md`
- 변경:
  - AGENTS.md: 목적(React), 정확성 원칙 두 층(공개 동작 = react.dev + 실제 실행 / 내부 구현 = React `v19.3.1` 태그(없으면 릴리스 커밋) 고정 소스 링크, "19.3.1 구현에서는"으로 서술하고 simplifications에 명시 / 비공식 분석 글은 근거가 아님), 깊이 전략 C(1부 공개 동작, 2부 내부 구현), React 버전 규칙("package.json의 react·react-dom 버전 = 기준 버전. 바꾸려면 사용자 승인, 내부 구현 페이지 재검토"), 예제 규칙(.jsx 완전한 프로그램, `#root`에 `createRoot`, StrictMode는 코드에 명시, `console.log`에 원시 값·`JSON.stringify` 결과만, 문자열에 `%` 금지, 지연 타이머·끝나지 않는 비동기 금지, 사용자 조작은 `interactions`, console.error/warn·예외가 나면 실패, React 모듈 상태는 jsdom 테스트 파일 안에서 공유됨), JS 사이트 링크 규칙(`jsPrerequisites`·`<JsLink>`만, 추가·수정 전 `npm run js-index:sync`), 디렉터리 구조·명령어 표(`js-index:sync`)·검증 순서 갱신. "새 개념만 추가했을 때" 축소 e2e 명령을 React 기준으로 다시 쓰고 `tests/e2e/react-examples.spec.ts`를 반드시 포함. 도서 장 순서 규칙은 로드맵 순서 규칙으로 대체.
  - content-guide: meta 필드 표(category 6종, jsPrerequisites, examples.runtime·interactions), 예제 절(위 규칙, `expectedOutput`은 실제 실행으로 채움), `<JsLink>`·`react18` Callout, 코드 펜스는 `jsx file=./examples/x.jsx`, L7 체크리스트를 React 기준으로(근거 링크 = react.dev + 고정 소스 링크, 공개 동작/내부 구현 구분, React 18 차이를 릴리스 노트·업그레이드 가이드로 확인, JS 링크 대상 확인).
  - concept-roadmap: 부록 A의 27개(번호, 제목, 1부/2부, 카테고리, order 제안 = 번호×10, 연결할 JS 페이지 "후보"(개념 작성 시 확정), React 18 차이 후보 "작성 시 확인", 13번은 JS 이벤트 루프 페이지 대기)와 범위 밖 목록(Server Components, React Compiler, `useSyncExternalStore`, 포털, 에러 경계).
- 완료 조건: AGENTS.md·content-guide에 위 항목이 모두 있다. concept-roadmap의 27개 번호·제목·1부/2부가 부록 A와 1:1로 같다. `npm run format:check` 통과.

### 8. 전체 검증
- 완료 조건: 6절 정적 명령 전체 통과, 실행기 음성 검사, 6절 브라우저 시나리오 1~5 확인.

## 9. 추가 개선 후보
- JS 인덱스 스냅샷이 실사이트와 다른지 확인하는 스크립트(`js-index:check`).
- jsdom·Chromium에서 예제가 남긴 미해결 타이머 수를 추적해 settle 판단을 보강.
- Sandpack 도입(의존성 승인 필요).

## 부록 A. 확정된 개념 목록 (2026-11-02 사용자 확정)
### 1부: 공개 동작
| # | 제목 | JS 연결 후보 |
|---|---|---|
| 1 | JSX는 함수 호출이다: element는 그냥 객체 | `function-calls`, `primitives-and-objects` |
| 2 | 렌더링은 컴포넌트 함수를 호출하는 것: 트리거 → 렌더 → 커밋 | `function-calls` |
| 3 | 순수 함수와 StrictMode: 왜 두 번 실행될까 | — |
| 4 | props는 읽기 전용이다 | `primitives-and-objects`, `property-attributes` |
| 5 | state는 스냅샷이다: setState 직후 값이 그대로인 이유 | `closure` |
| 6 | 배칭과 함수형 업데이트: `setCount(c => c + 1)` | `arrow-functions` |
| 7 | 객체·배열 state: 변경하면 왜 화면이 안 바뀔까 | `equality-operators`, `primitives-and-objects`, `array-method-pitfalls` |
| 8 | 리렌더링은 언제 일어나나: 부모가 렌더되면 자식도 | — |
| 9 | state는 트리 위치에 묶인다: 같은 자리 같은 타입이면 유지 | — |
| 10 | 리스트와 key: index key의 함정 | `array-index-length` |
| 11 | 이벤트 핸들러: 함수를 넘기는 것과 호출하는 것 | `this-binding`, `arrow-functions` |
| 12 | ref: 렌더에 영향을 주지 않는 값 | `closure` |
| 13 | `useEffect` 실행 시점과 cleanup | 이벤트 루프(JS 사이트에 아직 없음) |
| 14 | deps 배열과 stale closure | `closure`, `equality-operators` |
| 15 | `memo`·`useMemo`·`useCallback`: 무엇을 건너뛰나 | `equality-operators` |
| 16 | Context는 리렌더링을 어떻게 퍼뜨리나 | — |

### 2부: 내부 구현 (v19.3.1 소스 기준)
| # | 제목 | 1부 연결 |
|---|---|---|
| 17 | Fiber 노드: child·sibling·return으로 이어진 트리 | 2, 9 |
| 18 | current와 workInProgress: 이중 버퍼 | 2 |
| 19 | 렌더 단계와 커밋 단계: work loop | 2, 13 |
| 20 | hooks 연결 리스트: 호출 순서 규칙이 있는 이유 | 5, 12 |
| 21 | 업데이트 큐: setState는 어디에 쌓이나 | 5, 6 |
| 22 | 자식 재조정: type과 key 비교 | 9, 10 |
| 23 | lanes: 업데이트의 우선순위 | 6 |
| 24 | transition과 `useDeferredValue` | 23 |
| 25 | Suspense: 렌더 중에 기다리기 | 19 |
| 26 | 합성 이벤트와 루트 위임 | 11 |
| 27 | React 19 Actions: `useActionState`, `useOptimistic`, `use()` | 24, 25 |

React 18 차이 후보(작성 시 릴리스 노트로 확인): 1(element의 `ref`), 3(StrictMode 두 번째 렌더의 메모이제이션 재사용), 12(ref를 prop으로, ref cleanup), 16(`<Context>`를 Provider로), 27.

## 구현 진행

- baseline (2026-11-02, 뼈대 추출 직후·커밋 없음): lint 통과 / format:check 통과 / typecheck 통과 / build 통과 / vitest 실패 — `tests/examples.test.ts`(No test suite), content-integrity "개념이 하나 이상", concepts.test 레지스트리 5건, ConceptPager.test 3건, ConceptCard.test 2건 (모두 개념 0개로 인한 예상 실패, 작업 순서 2·5에서 해소)
- [x] 1. 프로젝트 초기화와 뼈대 가져오기 — `git branch --show-current` = main, `app/concepts`는 `.gitkeep`만, `.claude/plans`는 이 문서만, `npm ci`·`npm run build` 성공(sitemap 2개 URL)
- [x] 2. React 예제 실행기(jsdom)와 examples 타입 — `npx vitest run tests/react-examples.test.ts` 6건 통과(픽스처 4, `%` 위반 1, 연속 실행 1), typecheck·lint 통과, 픽스처 4개가 스파이크 파일과 동일(`diff`), 음성 검사(기대값 변경 시 실패) 서브에이전트 수행. 변경: 개념 예제 describe는 개념이 1개 이상일 때만 등록(빈 describe는 Vitest 실패) — `tests/react-examples.test.ts`
- [x] 7. 문서와 로드맵 — `git ls-remote` 로 `v19.3.1` 태그 존재 확인(61aa00d) → `blob/v19.3.1` 고정 링크 형식 사용, concept-roadmap 27개 번호·제목이 부록 A와 1:1(`diff` 일치), AGENTS.md·content-guide에 `ecmascript`/`run-example`/도서 언급 없음, prettier 통과(서브에이전트, 전체 검증에서 재확인). 결정: 로드맵 상태 "확정(개념 작성 전)", 2부 표는 "1부 연결" 열
- [x] 3. Chromium 교차 검증 스펙 — `npx playwright test tests/e2e/react-examples.spec.ts` 4 passed / 4 skipped(mobile) 메인 재실행 확인. 서브에이전트 확인: vite build 로그 1회, 기대값 변경 시 실패, 임시 스텁 `zz-runner-check/a`가 jsdom·Chromium 양쪽에서 실행·통과 후 삭제(`ls -A app/concepts` = `.gitkeep`). 결정: 최상위 await 동작해 동기 helper 대안 미사용, `beforeAll({}, …)`에 `no-empty-pattern` 비활성 주석(Playwright가 구조 분해 패턴 요구)
- [x] 4. ConceptMeta 확장과 JS 사이트 링크 — `js-site-index.json`에 slug 31개(실사이트 sitemap `/concepts/` 31개와 일치, 계획 추정 29는 저장소 @980716b 폴더 수 기준이라 틀림 — 완료 조건은 "sitemap 개념 수"라 충족), `closure`에 `호출마다-새-환경` 있음. typecheck·lint·format:check 통과, vitest 실패 11건은 baseline 개념 0개 실패와 동일(새 실패 없음). 원본 대비 변경 파일이 모두 작업 4 범위 안임을 `cmp`로 확인
- [x] 5. 개념 0개 대응 테스트 정리 — 메인 재실행: `vitest` 17 files·93 tests 통과, `test:build` 16 통과, `playwright test` 32 passed·4 skipped. 계획과 다른 점 2건(아래 목록 마지막 항목): `build-output`의 빈 `it.each` describe 2개에 `skipIf`, `navigation.spec`의 `SITE_NAME`은 소스 정규식으로 읽음(site.ts가 `import.meta.env` 사용)
- [x] 6. 사이트 정체성 — `ECMAScript` grep 결과 없음, `js-under-the-hood-kappa`는 `js-site.ts`·`js-site-index.json`·content-integrity `JS_SITE_HOST`에서만, og 1200×630·34,767B. `package-lock.json`은 `npm install --package-lock-only`가 tailwind oxide-wasm32 번들 항목 66줄을 추가해 원본으로 되돌리고 name 2줄만 수정(diff 2+/2-), `npm ci` 성공. 해석: "JS Under the Hood" grep은 JS 링크 문맥(JsLink·concepts.ts·sync 스크립트 주석, PrerequisiteList 테스트의 sr 텍스트 단언, README 관계·js-index:sync 설명)에서만 나와 의도(JS 사이트 정체성 문구 잔존 없음) 충족으로 판단
- [x] 8. 전체 검증 — 메인 재실행: lint·format:check·typecheck 통과, vitest 93 통과, test:build 16 통과(sitemap URL http://localhost:4173), playwright 32 passed·4 skipped. 음성 검사: click-batching 기대값을 `render 2`로 바꾸면 jsdom 1 failed·Chromium 1 failed, 되돌리면 통과. 브라우저(dev): `/` h1·설명·빈 상태 문구·콘솔 에러 없음, `/about` `#accuracy` 있음·ECMAScript 없음·JS 사이트 새 창 링크, 푸터 React 문구, 404 페이지와 홈 링크, 375px·다크에서 `/`·`/about` scrollWidth = innerWidth(375)
- 리뷰 1차(critical-code-review, 메인 직접): Critical 0 · High 0 · Low 3(보고만) — ① `tests/content-integrity.test.ts`의 `JS_SITE_HOST`가 `js-site.ts`의 `JS_SITE_URL`과 별도 하드코딩 ② `app/lib/concepts.test.ts`에서 개념 0개에서도 통과하는 "없는 슬러그는 오류를 던진다" 2건까지 삭제(계획 범위 문구대로, 복원 목록에 있음) ③ AGENTS.md 디렉터리 구조에 `app/concepts/.gitkeep`(빈 폴더 유지 이유) 언급 없음

- 작업 5 삭제 목록(첫 개념 작업에서 다시 추가) — 개념 0개에서 성립하지 않아 지운 테스트. 원본은 JS 저장소 980716b(`tests/e2e/*`·`build-output`의 개념별 테스트는 React 개념에 맞게 새로 쓴다):
  - `tests/content-integrity.test.ts`: `개념 폴더` > '개념이 하나 이상 있다'
  - `app/lib/concepts.test.ts`: describe 'listConcepts / getConcept'(‘제목의 한국어 정렬 순서로 정렬해 돌려준다’, ‘슬러그로 개념을 찾는다’, ‘없는 슬러그는 오류를 던진다’) 전체, describe 'getAdjacentConcepts'(‘첫 개념은 이전이 없고 position은 1이다’, ‘마지막 개념은 다음이 없다’, ‘중간 개념은 앞뒤 개념을 돌려준다’, ‘없는 슬러그는 오류를 던진다’) 전체. 개념 0개에서도 통과하는 ‘없는 슬러그는 오류를 던진다’ 2건도 계획대로 함께 삭제(첫 개념 작업에서 복원 시 스텁으로 대체 가능)
  - 파일 삭제: `app/components/concept/ConceptPager.test.tsx`, `tests/e2e/concept.spec.ts`, `tests/e2e/no-js.spec.ts`
  - `app/components/site/ConceptCard.test.tsx`: 삭제 없음(`listConcepts()[0]` → 스텁 `ConceptMeta`로 교체)
  - `tests/build/build-output.test.ts`: describe '시뮬레이터 프리렌더 (primitives-and-objects)', '시뮬레이터 프리렌더 (short-circuit-evaluation)', '시뮬레이터 프리렌더 (type-coercion)', '시뮬레이터 프리렌더 (equality-operators)', '시뮬레이터 프리렌더 (increment-decrement)', '프리렌더 (number-type)', '프리렌더 (typeof-operator)', '시뮬레이터 프리렌더 (switch-break-continue)', '시뮬레이터 프리렌더 (property-keys)', '시뮬레이터 프리렌더 (function-calls)', '시뮬레이터 프리렌더 (hoisting)', '시뮬레이터 프리렌더 (scope-chain)', '시뮬레이터 프리렌더 (block-scope)', '시뮬레이터 프리렌더 (tdz)', '시뮬레이터 프리렌더 (property-attributes)', '시뮬레이터 프리렌더 (new-operator)', '시뮬레이터 프리렌더 (prototype-chain)', '프리렌더 (primitive-methods)', '프리렌더 (global-object)', '프리렌더 (iife-module-pattern)', '프리렌더 (class-basics)', '시뮬레이터 프리렌더 (class-inheritance)', '프리렌더 (arrow-functions)', '시뮬레이터 프리렌더 (array-index-length)', '시뮬레이터 프리렌더 (this-binding)', '시뮬레이터 프리렌더 (execution-context)', '시뮬레이터 프리렌더 (closure)', '시뮬레이터 프리렌더 (for-let)', '프리렌더 (array-method-pitfalls)'
  - `tests/e2e/helpers.ts`: `CONCEPT_PATH`, `SIMULATOR_NAME` 및 모든 `*_PATH`·`*_SIMULATOR_NAME` 상수(개념 29개분)
  - `tests/e2e/navigation.spec.ts`: '홈 → 검색 → 카드 클릭 → 개념 페이지', '/?q=객체 직접 진입 시 입력값과 결과가 유지되고 콘솔 에러가 없다', '홈: 학습 순서 보기로 전환하면 URL과 카드 순서가 바뀌고 검색·뒤로 가기와 함께 유지된다', '/?view=order 직접 진입 시 학습 순서 보기이고 콘솔 에러가 없다', '개념 페이지 하단: 처음·마지막 개념은 한쪽 링크만 있고 중간 개념은 다음으로 이동한다'
  - `tests/e2e/a11y.spec.ts`(axe light/dark 각각): '홈: 학습 순서 보기', '개념 페이지', '개념 페이지: 시뮬레이터를 진행한 뒤', '개념 페이지: 단축 평가', '개념 페이지: 단축 평가 시뮬레이터를 진행한 뒤', '개념 페이지: 암묵적 타입 변환', '개념 페이지: 암묵적 타입 변환 시뮬레이터를 진행한 뒤', '개념 페이지: 동등 비교', '개념 페이지: 숫자 타입', '개념 페이지: typeof 연산자', '개념 페이지: 증감 연산자', '개념 페이지: 증감 연산자 시뮬레이터를 진행한 뒤', '개념 페이지: switch와 break·continue', '개념 페이지: switch와 break·continue 시뮬레이터를 진행한 뒤', '개념 페이지: 프로퍼티 키', '개념 페이지: 프로퍼티 키 시뮬레이터를 진행한 뒤', '개념 페이지: 함수 호출', '개념 페이지: 함수 호출 시뮬레이터를 진행한 뒤', '개념 페이지: 호이스팅', '개념 페이지: 호이스팅 시뮬레이터를 진행한 뒤', '개념 페이지: 스코프 체인', '개념 페이지: 스코프 체인 시뮬레이터를 진행한 뒤', '개념 페이지: 블록 스코프', '개념 페이지: 블록 스코프 시뮬레이터를 진행한 뒤', '개념 페이지: TDZ', '개념 페이지: TDZ 시뮬레이터를 진행한 뒤', '개념 페이지: TDZ 시뮬레이터 3단계에서 초기화 전 이름 찾기 결과를 보인다', '개념 페이지: 프로퍼티 어트리뷰트', '개념 페이지: 프로퍼티 어트리뷰트 시뮬레이터를 진행한 뒤', '개념 페이지: 프로퍼티 어트리뷰트 시뮬레이터 4단계에서 대입 결과를 보인다', '개념 페이지: new 연산자', '개념 페이지: new 연산자 시뮬레이터를 진행한 뒤', '개념 페이지: new 연산자 시뮬레이터 7단계에서 return한 객체가 결과가 된다', '개념 페이지: 프로토타입 체인', '개념 페이지: 프로토타입 체인 시뮬레이터를 진행한 뒤', '개념 페이지: 원시 값의 메서드 호출', '개념 페이지: 전역 객체', '개념 페이지: 즉시 실행 함수와 모듈 패턴', '개념 페이지: 클래스는 함수다', '개념 페이지: 클래스 상속과 super', '개념 페이지: 클래스 상속 시뮬레이터를 진행한 뒤', '개념 페이지: 클래스 상속 시뮬레이터 4단계에서 this가 초기화 전이고 7단계에서 초기화된다', '개념 페이지: 화살표 함수와 메서드 축약', '개념 페이지: 배열은 객체다', '개념 페이지: 배열 length 시뮬레이터를 진행한 뒤', '개념 페이지: 배열 메서드의 함정', '개념 페이지: 배열 length 시뮬레이터 5단계에서 length가 5이고 구멍이 보인다', '개념 페이지: 프로토타입 체인 시뮬레이터 10단계에서 체인 끝을 보인다', '개념 페이지: this', '개념 페이지: this 시뮬레이터를 진행한 뒤', '개념 페이지: this 시뮬레이터 whoAmI() 단계에서 전역 객체를 보인다', '개념 페이지: 실행 컨텍스트', '개념 페이지: 실행 컨텍스트 시뮬레이터를 진행한 뒤', '개념 페이지: 실행 컨텍스트 시뮬레이터 label 이름 찾기 단계에서 찾은 곳을 보인다', '개념 페이지: 클로저', '개념 페이지: 클로저 시뮬레이터를 진행한 뒤', '개념 페이지: 클로저 시뮬레이터 makeCounter 반환 단계에서 남아 있음을 보인다', '개념 페이지: for 문의 let', '개념 페이지: for 문의 let 시뮬레이터를 진행한 뒤', '개념 페이지: for 문의 let 시뮬레이터 새 반복 레코드 단계에서 이전 레코드가 남아 있음을 보인다', '개념 페이지: 동등 비교 시뮬레이터를 진행한 뒤', '개념 페이지: 퀴즈 정답을 공개한 뒤'
  - `tests/e2e/responsive.spec.ts`: 경로 배열의 `CONCEPT_PATH`, 개념 경로별 '`<path>`: 가로 스크롤이 없다'(개념 29개)와 '<개념명> 개념 페이지: 시뮬레이터를 끝까지 진행해도 가로 스크롤이 없다', '`<path>`: 하단 학습 순서 내비게이션이 있어도 가로 스크롤이 없다'(closure·hoisting 루프), '홈 학습 순서 보기: 가로 스크롤이 없다'
  - 삭제는 아니지만 변경한 것(첫 개념 작업에서 `skipIf`가 필요 없어지면 되돌림): `build-output.test.ts`의 '개념 상세 HTML'·'학습 순서 pager'는 빈 `it.each`가 Vitest에서 "No test found"로 실패해 `describe.skipIf(concepts.length === 0)`로 감쌈. `navigation.spec.ts`의 `SITE_NAME`은 `app/lib/site.ts`가 `import.meta.env`를 써서 Playwright(Node)에서 import하면 TypeError라, 같은 파일 소스에서 정규식으로 읽음.

## 구현 결과

### 계획 대비 실제 구현

- 작업 순서 1~8을 계획대로 구현했다. 달라진 점:
  - JS 사이트 개념 수는 추정 29개가 아니라 31개(배포가 저장소 @980716b보다 앞섬). 완료 조건은 "sitemap 개념 수"라 그대로 충족.
  - `npm install --package-lock-only`가 lock에 무관한 66줄을 추가해, 원본 lock으로 되돌리고 name 2줄만 수정.
  - 개념 0개에서 빈 `it.each`가 든 describe는 Vitest가 실패시켜 `build-output`의 두 describe에 `skipIf`, `react-examples.test.ts`의 개념 describe는 개념이 있을 때만 등록.
  - `app/lib/site.ts`가 `import.meta.env`를 써서 Playwright에서 import할 수 없어 `navigation.spec.ts`는 소스에서 `SITE_NAME`을 정규식으로 읽음.

### 코드 리뷰

- Critical·High 0건. Low 3건(JS 호스트 문자열 중복, 0개에서도 통과하던 테스트 2건 삭제, AGENTS.md에 `.gitkeep` 설명 없음)은 수정하지 않고 보고.

### 후속 작업

- [x] 첫 개념(로드맵 1번 JSX) 작성 (2026-11-03, `.claude/plans/concept-jsx-to-element.md`) — "작업 5 삭제 목록"의 개념 페이지 테스트를 그 개념 기준으로 다시 추가하고 `skipIf` 제거
- [ ] 배포 도메인이 정해지면 `.env`·`app/lib/site.ts`·`scripts/postbuild.mjs` 기본 URL 갱신, Vercel 연결
- [ ] JS 사이트에 이벤트 루프 개념이 생기면 13번(`useEffect`) 링크 연결
- [ ] (선택) Low 3건 정리, Sandpack 도입 검토(의존성 승인 필요)

### 이해 확인

#### 설명할 수 있어야 하는 기술적 판단

- [Claude 판단] lock 파일 복원 — `npm install --package-lock-only` 결과(66줄 추가)를 쓰지 않고 원본 lock을 되돌려 name만 바꿈. 이유: 계획은 "의존성 변경 없음"이고, 설치 결과가 바뀔 수 있는 lock 변경을 이름 변경에 섞지 않기 위해.
- [Claude 판단] 개념 0개 대응 방식 — 빈 `it.each` describe를 `skipIf`로 감싸고, e2e의 사이트 이름은 소스 정규식으로 읽음. 택하지 않은 대안: 가짜 개념 추가(공개 페이지가 생김), `site.ts` 수정(범위 밖).
- [무검토 승인] 예제 실행기는 `act` 없이 실제 스케줄러로 실행 — `act`는 업데이트를 범위 끝에서 모아 처리하고 act 밖 업데이트에 경고를 내 브라우저와 시점이 달라질 수 있음. 스파이크에서 act/비act/Chromium 결과가 같아 브라우저에 가까운 쪽 선택(3절).
- [무검토 승인] 사용자 조작을 예제 코드가 아니라 `meta.examples[].interactions`로 분리 — 본문에 보이는 코드에 테스트용 클릭 코드가 섞이지 않게(3절).
- [무검토 승인] JS 링크 검증은 스냅샷 JSON(`js-site-index.json`) — 테스트마다 실사이트 fetch(네트워크 의존)나 로컬 JS 저장소 경로(환경 의존) 대신. 대가: JS 사이트 제목이 바뀌면 `js-index:sync`를 다시 돌려야 함.
- [무검토 승인] 카테고리 6종(렌더링 기초 ~ 동시성)과 `'ecmascript'` vm 실행기 제거.
- jsdom + Chromium 교차 검증, 개념 0개로 뼈대만 먼저, `git init` 포함 — 사용자 선택.

#### 배경지식

- `vi.resetModules()`는 Vite가 변환한 모듈만 초기화한다. node_modules의 react·react-dom·scheduler는 외부화되어 Node 캐시에 남으므로 예제 모듈만 다시 실행되고 React 상태는 같은 테스트 파일 안에서 공유된다.
- Vite `build`에서 `mode: 'development'`만으로는 의존성 안의 `process.env.NODE_ENV`가 바뀌지 않는다. `define`으로 고정해야 React 개발 빌드(StrictMode 이중 실행, DevTools 안내 메시지)가 묶인다.
- Playwright `fullyParallel: true`에서 `beforeAll`은 파일이 아니라 워커마다 실행된다. 빌드·서버 같은 무거운 준비는 프로젝트 skip과 직렬 모드로 한 번만 돌게 해야 한다.
- 클릭 같은 이산 이벤트에서 `setState`의 렌더는 핸들러가 끝난 뒤 microtask로 처리된다. 그래서 핸들러 안에서 먼저 예약한 `Promise.then`이 렌더보다 먼저 찍힌다(픽스처 microtask-order).
- git은 빈 디렉터리를 추적하지 않는다. `routes.ts`의 `readdirSync`가 폴더 없음으로 실패하지 않도록 `.gitkeep`을 둔다.

#### 확인 질문

1. 예제 실행에 `act()`를 쓰지 않은 이유는 무엇이고, `act()`를 쓰면 어떤 예제에서 결과가 달라질 수 있나?
   <details><summary>답</summary>`act`는 범위 안의 업데이트·effect를 범위 끝에서 한꺼번에 처리하고 act 밖 업데이트에 경고를 낸다. 브라우저 실제 스케줄링과 시점이 달라질 수 있어, 스케줄링 순서(microtask·timeout과 렌더의 순서 등)를 보이는 예제에서 차이가 날 수 있다. 스파이크 4개에서는 같았다(3절, 2절 스파이크 항목).</details>
2. jsdom 테스트만 있어도 되는데 Chromium 교차 검증을 따로 두는 이유는? jsdom이 놓칠 수 있는 차이의 예를 하나 들어 보라.
   <details><summary>답</summary>jsdom은 실제 브라우저가 아니다. 스케줄러가 Node에서는 setImmediate, 브라우저에서는 MessageChannel을 쓸 것으로 추정되고, jsdom의 `element.click()`은 click 이벤트만 보내지만 `page.click`은 pointerdown/mousedown/up까지 보낸다. 그래서 onMouseDown을 쓰는 예제 등에서 차이가 날 수 있다(5절 첫 항목, `tests/e2e/react-examples.spec.ts`).</details>
3. `package-lock.json`을 `npm install --package-lock-only` 결과 그대로 커밋하지 않은 이유는?
   <details><summary>답</summary>name만 바꾸는 작업인데 npm이 tailwind oxide-wasm32 번들 항목 66줄을 추가했다. 계획은 의존성 변경 없음이었고 lock 변경은 설치 결과에 영향을 줄 수 있어 원본으로 되돌리고 name 2줄만 수정했다(구현 진행 6).</details>
4. JS 사이트 링크를 테스트할 때 실사이트를 매번 fetch하지 않고 스냅샷 JSON을 쓰면 무엇을 얻고 무엇을 잃나?
   <details><summary>답</summary>얻는 것: 네트워크 없이 결정적인 테스트. 잃는 것: JS 사이트 제목·앵커가 바뀌어도 스냅샷을 갱신하기 전까지 테스트가 통과한다. 그래서 링크를 추가·수정하기 전 `npm run js-index:sync`를 규칙으로 둠(3절, AGENTS.md 규칙).</details>
5. 첫 개념을 추가할 때 이번에 넣은 `skipIf`와 삭제한 테스트는 어떻게 해야 하나?
   <details><summary>답</summary>"작업 5 삭제 목록"을 보고 개념 페이지 e2e·빌드 검사·페이저 테스트를 그 개념 기준으로 다시 쓰고, 개념이 생겨 빈 `it.each`가 아니게 되면 `build-output`의 `skipIf`를 제거한다(구현 진행 작업 5 목록 마지막 항목).</details>

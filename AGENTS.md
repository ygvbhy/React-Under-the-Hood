# React Under the Hood

## 목적

React 코드가 "왜 그렇게 동작하는지"를 시각적으로 확인하고 설명하는 한국어 정적 학습 사이트. 기준 버전은 React 19.3.1이다. 개념 1개 = 독립 URL 1개(`/concepts/<slug>`)이며, 로드맵([.claude/plans/concept-roadmap.md](.claude/plans/concept-roadmap.md))의 순서에 맞춰 개념을 하나씩 추가한다. 새 개념은 `app/concepts/<slug>/` 폴더만 추가하면 되고 공통 코드를 고치지 않는다. 절차는 [docs/content-guide.md](docs/content-guide.md).

자바스크립트 언어 동작은 자매 사이트 JS Under the Hood(`https://js-under-the-hood-kappa.vercel.app`)로 연결한다. 이 사이트에서는 React 동작만 설명한다.

스택: Vite 기반 React Router Framework mode(프리렌더, `ssr: false`) + MDX + Tailwind 4 + Shiki. 백엔드·DB는 없고 Vercel에 정적 파일로 배포한다.

## 정확성 원칙 (최우선)

근거는 두 층으로 나눈다.

- 공개 동작: react.dev 문서가 보장하는 동작과 실제 실행 결과. 페이지의 모든 "실행 결과" 주장은 실제 실행으로 검증한다(`npm test`가 예제를 실제로 실행해 대조한다). 출력은 추측해서 쓰지 않는다.
- 내부 구현: React `v19.3.1` 태그에 고정한 소스 링크(`https://github.com/facebook/react/blob/v19.3.1/<경로>#L<줄>`). 태그 `v19.3.1`은 존재하는 것을 확인했다(커밋 `61aa00df822d0eb76d0362eb8b6fdd3527693efe`). 내부 구현은 "19.3.1 구현에서는"으로 서술하고, 버전마다 바뀔 수 있음을 `meta.simplifications`에 명시한다.
- 공개 동작과 내부 구현을 구분해서 쓴다. 내부 구현을 공개 동작의 보장처럼 쓰지 않는다.
- 비공식 분석 글(블로그, 영상 등)은 근거가 아니다. react.dev, 고정 소스, 실제 실행 결과만 근거로 쓴다.
- 교육용 추상화(트리 그림, 큐 그림 등)를 React 내부 구현 그대로인 것처럼 서술하지 않는다.
- 단순화한 부분은 반드시 페이지에 명시한다(`meta.simplifications`).
- 확실하지 않은 동작은 사실처럼 쓰지 않는다. 불확실하면 그렇다고 밝히거나 쓰지 않는다.

## 규칙

- 개념은 로드맵(`.claude/plans/concept-roadmap.md`)의 순서를 따라 추가한다. 1부(공개 동작)를 먼저 쓰고 2부(내부 구현)는 1부의 연결 개념을 쓴 뒤에 쓴다. 다음에 쓸 개념은 사용자에게 확인한다. 로드맵 밖의 개념은 사용자 승인 후 로드맵을 먼저 갱신한다.
- 깊이 전략은 1부 공개 동작, 2부 내부 구현이다. 1부 페이지는 내부 구현 없이 공개 동작과 실행 결과만으로 설명하고, 내부 구현은 2부 페이지에서 소스를 근거로 다룬다.
- React 버전: `package.json`의 `react`·`react-dom` 버전이 기준 버전이다. 바꾸려면 사용자 승인을 받고, 내부 구현 페이지를 다시 검토한다.
- React 18과 달라진 점은 `<Callout type="react18">`로 표시한다. 차이는 릴리스 노트·업그레이드 가이드로 확인한 것만 쓴다.
- JS 사이트 링크: 선행 개념은 `meta.jsPrerequisites`, 본문은 `<JsLink>`만 쓴다. 본문에 JS 사이트 URL을 직접 쓰지 않는다(테스트가 막는다). 링크를 추가·수정하기 전에 `npm run js-index:sync`로 인덱스(`app/lib/js-site-index.json`)를 갱신한다.
- 의존성은 근거를 제시하고 사용자 승인을 받은 뒤에만 추가한다. 패키지 버전은 정확히 고정한다(`npm install --save-exact`, `package.json`에 `^`·`~` 금지). 예: 마크다운 표(GFM)를 위해 `remark-gfm`을 넣는 대신 표는 JSX `<table>`로 쓴다. `serve@14.2.6`이 고정한 취약 `compression`(GHSA-vc2v-76pw-4v95)은 `package.json` `overrides`로 1.8.2에 고정했다. `serve`가 고친 버전을 내면 override를 제거한다.
- 계획 문서는 `.claude/plans/`에 둔다. 구현 중 사실과 결정은 해당 계획 문서의 "구현 진행"에 기록한다.
- 커밋은 사용자가 요청했을 때만 한다.
- Claude가 만든 커밋은 메시지 끝에 `Co-Authored-By: Claude <모델명> <noreply@anthropic.com>`(예: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`)을 넣는다. GitHub이 이 줄로 Claude를 공동 작성자로 표시한다.

## 디렉터리 구조

```
app/
  root.tsx, routes.ts, app.css   # html shell(lang="ko"), 라우트 등록(app/concepts/* 자동 스캔), Tailwind 테마 토큰
  routes/                        # home, about, not-found
  components/site/               # SiteHeader, SiteFooter, SkipLink
  components/concept/            # ConceptLayout, Callout, PredictQuiz, JsLink, mdx-components.tsx 등 개념 페이지 공통 부품
  simulator/                     # 시뮬레이터 공통: types, useStepper, StepControls, CodeView, SimulatorShell (+ 테스트)
  lib/                           # concepts.ts(ConceptMeta·레지스트리), seo.ts, site.ts, js-site.ts, js-site-index.json, useHydrated.ts
  concepts/<slug>/               # 개념 1개 = 폴더 1개 (slug = 폴더명, kebab-case)
    meta.ts                      # 메타데이터(순수 데이터)
    content.mdx                  # 설명 본문
    route.tsx                    # 얇은 라우트 모듈
    examples/*.jsx               # 실행 검증되는 React 예제(완전한 프로그램)
    scenarios.ts 등              # (선택) 시뮬레이터: 시나리오, 시각화, Simulator.tsx(공통 셸 래퍼)
    concept.test.ts              # (시뮬레이터가 있으면) 시나리오 불변식 테스트
tests/
  helpers/                       # run-react-example.ts, react-example-cases.ts, scenario-invariants.ts
  fixtures/react-examples/        # 예제 실행기 검증용 픽스처(.jsx)와 cases.ts
  content-integrity.test.ts      # 메타데이터·필수 h2·JS 링크 무결성 (L3)
  react-examples.test.ts         # React 예제 실제 실행, jsdom (L1)
  build/                         # 빌드 결과 검사 — `npm run test:build` 전용
  e2e/                           # Playwright — `npm run e2e` 전용 (react-examples.spec.ts = Chromium 교차 검증)
scripts/                         # postbuild.mjs(404.html, sitemap, robots), generate-og.mjs, sync-js-index.mjs
docs/content-guide.md            # 새 개념 추가 절차·작성 규칙·검토 체크리스트
vercel.json, serve.json          # 배포 설정, 로컬 정적 서빙 설정
```

## 하이드레이션 규칙

사이트는 프리렌더한 HTML을 클라이언트에서 하이드레이션한다. 첫 클라이언트 렌더는 프리렌더 HTML과 같아야 한다.

- 라우트에 `loader`를 두지 않는다. 콘텐츠는 정적 import로 가져온다(`.data` 요청이 생기지 않는다).
- 프리렌더 시점에 알 수 없는 값(URL query, JS 유무, 창 크기, `localStorage` 등)으로 첫 렌더 마크업을 바꾸지 않는다.
- 그런 값이 필요하면 `useHydrated()`(`app/lib/useHydrated.ts`)가 true가 된 뒤(마운트 후)에 전환한다. 예: `PredictQuiz`는 프리렌더에서 `<details>` 정답, 하이드레이션 후 라디오 퀴즈를 그린다. JS가 없어도 본문과 정답을 읽을 수 있어야 한다.
- 새 개념 폴더를 추가하면 `npm run dev` 서버를 재시작한다(`routes.ts`는 서버 시작 시에만 폴더를 스캔한다).

## 예제 규칙

- 출력 결과를 주장하는 예제는 반드시 `examples/*.jsx`에 파일로 두고 `meta.examples`에 등록한다. 본문의 코드 블록은 `jsx file=./examples/x.jsx` 문법으로 그 파일을 가져온다(복붙 금지).
- 예제 파일은 사용자가 보는 완전한 React 프로그램이다. `#root` 요소에 `createRoot(document.getElementById('root')).render(...)`로 렌더하는 줄까지 포함한다. StrictMode는 필요할 때 코드에 명시한다(자동으로 감싸 주지 않는다).
- `console.log`에는 원시 값, 불리언, `JSON.stringify` 결과만 넘긴다. 객체를 직접 출력하지 않는다(호스트마다 출력 형식이 다르다). 문자열에 `%`를 쓰지 않는다(`console.log`가 서식 지정자로 해석한다. 실행기가 위반으로 기록한다).
- 지연 타이머와 끝나지 않는 비동기 작업을 쓰지 않는다. 실행기는 짧은 대기로 출력이 멈추는 것을 확인하므로 결과가 대기 시간에 따라 달라진다.
- 사용자 조작(클릭)은 예제 코드에 넣지 않고 `meta.examples[].interactions`(`{ type: 'click', selector }[]`)로 실행기가 수행한다.
- 실행 방식: `npm test`(`tests/react-examples.test.ts`)가 jsdom에서 `act` 없이 실제 스케줄러로 예제를 실행해 `console.log` 출력을 `expectedOutput`과 대조한다. 같은 예제를 Chromium에서도 실행해 같은 기대값과 대조한다(`tests/e2e/react-examples.spec.ts`, desktop 프로젝트에서 한 번).
- `console.error`/`console.warn`이 나오거나 렌더·effect·핸들러에서 예외가 나면 예제가 실패한다.
- jsdom 테스트에서 React 모듈 상태(개발 경고의 중복 제거, 이전 root)는 같은 테스트 파일 안에서 예제 사이에 공유된다. 예제가 다른 예제의 실행에 영향받지 않도록 쓴다.
- `app/concepts/*/examples/**`는 Prettier와 ESLint에서 제외한다. 시뮬레이터가 줄 번호(`line`)로 코드를 강조하므로 자동 포맷으로 줄이 바뀌면 안 된다.
- 예제는 저장소에 포함된 신뢰된 코드만 실행한다.

## 시뮬레이터 규칙

- 시나리오의 각 `Step`은 그 시점의 **전체 상태 스냅샷**을 담는다(이전 단계와의 차분이 아님). 그래야 이전/다음/처음으로 이동이 단순하고 단계별 테스트가 쉽다.
- 개념 간 공유 부품은 `app/simulator/`(`types.ts`, `useStepper`, `StepControls`, `CodeView`, `SimulatorShell`)뿐이다. 상태 모양(state shape)과 시각화는 개념마다 다르게 설계한다.
- 시나리오 선택, 배치, 키보드 처리, 스크린 리더 안내, 콘솔 출력은 공통 셸 `SimulatorShell`이 맡는다. 개념 폴더의 `Simulator.tsx`는 영역 `aria-label`(`label`)과 시각화 렌더 함수(`renderState(state, prevState)`)만 넘기는 얇은 래퍼다. 셸을 바꾸면 모든 시뮬레이터 개념의 `Simulator.test.tsx`와 e2e로 회귀를 확인한다.
- 시뮬레이터의 코드는 `examples/<file>?raw` import로 가져와 예제 파일 원문과 같게 유지하고, 마지막 단계의 출력은 `expectedOutput`과 같아야 한다(`assertScenarioInvariants`가 검사한다).
- 시뮬레이터는 JS 없이도(프리렌더 상태) 문제 없이 보이는 첫 단계를 그린다.

## 명령어

| 명령어                  | 설명                                                                                         | 언제 실행하나                         |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `npm run dev`           | 개발 서버. 새 개념 폴더를 추가하면 재시작 필요                                               | 작업 중 화면 확인                     |
| `npm run build`         | 프리렌더 정적 빌드 → `build/client` (+ 404.html, sitemap, robots 생성)                       | 배포 전, e2e 전                       |
| `npm run start`         | `build/client`를 `serve`로 정적 서빙 (`serve.json` 사용)                                     | 빌드 결과를 로컬에서 직접 확인할 때   |
| `npm run typecheck`     | `react-router typegen && tsc --noEmit`                                                       | 타입이 바뀌는 모든 작업 후            |
| `npm run lint`          | ESLint                                                                                       | 코드 변경 후                          |
| `npm run format`        | Prettier로 전체 파일 포맷                                                                    | 포맷 오류를 고칠 때                   |
| `npm run format:check`  | Prettier 검사 (`.md`·`.mdx`·`.json` 포함)                                                    | 마무리 전                             |
| `npm test`              | Vitest: React 예제 실행(L1, jsdom), 시나리오 불변식, 메타 무결성, 단위·컴포넌트              | 콘텐츠·코드 변경 후 항상              |
| `npm run test:build`    | `npm run build` 후 빌드 결과(HTML·SEO·sitemap·404) 검사                                      | 콘텐츠 추가, 라우트·SEO 변경 후       |
| `npm run e2e`           | Playwright(데스크톱 + 모바일) E2E, axe 접근성 검사, Chromium 예제 교차 검증. 먼저 build 필요 | UI·시뮬레이터·내비게이션·예제 변경 후 |
| `npm run js-index:sync` | JS Under the Hood의 개념 slug와 제목 앵커를 읽어 `app/lib/js-site-index.json` 갱신           | JS 사이트 링크를 추가·수정하기 전     |
| `npm run og:generate`   | `public/og-default.png` 재생성                                                               | 공유 이미지를 바꿀 때만               |

## 검증 순서

작업을 마치기 전에 아래를 순서대로 모두 통과시킨다. `e2e`는 `build/client`를 쓰므로 `test:build`(빌드 포함) 뒤에 실행한다.

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:build && npm run e2e
```

e2e 범위: 새 개념 폴더만 추가하고 공통 코드(`app/components/`, `app/simulator/`, `app/lib/`, `app/routes/`, `app/root.tsx`, `app/routes.ts`, `app/app.css`, 설정)를 바꾸지 않았으면 전체 `npm run e2e` 대신 새 페이지 관련 e2e만 실행한다. 개념 테스트가 없던 상태(개념 0개)에서 시작했으므로 `navigation.spec.ts`는 지금 개념 개수·이전/다음을 고정하지 않는다. 첫 개념과 함께 개념 e2e를 다시 추가하면 그 개념에 맞게 이 문장을 갱신한다. `react-examples.spec.ts`는 새 예제를 Chromium에서 실행하므로 반드시 함께 실행한다. `<slug>`와 `<a11y 케이스 이름>`은 새 개념에 맞춘다.

```bash
npx playwright test tests/e2e/navigation.spec.ts tests/e2e/react-examples.spec.ts && npx playwright test -g "<slug>|<a11y 케이스 이름>"
```

공통 코드를 바꿨거나 영향 범위가 애매하면 전체 `npm run e2e`를 실행한다.

최초 1회 `npx playwright install chromium`이 필요하다.

## 배포

- Vercel 정적 배포. 설정은 `vercel.json`(`framework: null`, `npm ci`, `npm run build`, 출력 `build/client`, `trailingSlash: false`, `/assets/*` immutable 캐시, 모든 경로에 `X-Content-Type-Options: nosniff`·`Referrer-Policy: strict-origin-when-cross-origin`·`X-Frame-Options: DENY`)이 정한다. main = Production, PR = Preview.
- 사이트 URL(canonical·og:url·sitemap)은 `VITE_SITE_URL` 환경변수로 정한다. 기본값은 커밋된 `.env`에 있고(배포 도메인이 정해지기 전에는 `http://localhost:4173`), 배포 도메인은 Vercel Production 환경변수로 덮어쓴다(셸·플랫폼 환경변수가 `.env`보다 우선). 도메인이 정해지면 `.env`, `app/lib/site.ts`, `scripts/postbuild.mjs`의 기본 URL을 함께 갱신한다. 로컬에서 다른 값을 쓰려면 `VITE_SITE_URL=... npm run build`처럼 셸 변수로 지정한다(앱 코드와 `postbuild.mjs`가 같은 값을 보도록 `.env.local`이 아니라 `.env` 또는 셸 변수를 쓴다).
- Node 버전: `package.json` `engines.node >= 22.22`, `.nvmrc`는 24.
- 404: 프리렌더된 `/404`를 `404.html`로 복사해 미지 경로에 쓰고, `noindex`를 둔다. 모든 경로가 프리렌더되므로 `__spa-fallback.html`은 빌드 후 삭제한다.

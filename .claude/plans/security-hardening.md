# 보안 점검 후속 조치 구현 계획

- 상태: 완료
- 작성일: 2026-11-03
- 기준: `main` @ `6250374` (+ 미커밋 배포 도메인 변경)

## 0. 요약

- 목적: 2026-11-03 보안 점검에서 나온 Low 4건을 사용자 선택대로 반영한다
- 범위: `vercel.json` 헤더 2개, 계획 문서의 로컬 경로 1줄, AGENTS.md·README 문서, GitHub 저장소의 Dependabot 알림 설정 / 앱 코드·테스트·의존성은 바꾸지 않는다
- 위험: CSP가 페이지 동작을 막을 수 있다 → 스크립트·스타일·이미지·연결 지시어는 넣지 않고, 배포 후 콘솔에서 CSP 위반이 없는지 확인한다
- 복잡도: 낮음 · Consensus: 생략 (서로 독립적인 작은 설정·문서 변경 4건이고 JS 사이트 보안 리뷰와 같은 패턴)
- 미확정: 1건

## 1. 요구사항

- 요구사항(사용자: "보안 이슈 관련해서 조사 진행 한 뒤 반영하자", 점검 결과 4건 모두 선택)
  - S1 공개 저장소에 커밋된 계획 문서에서 로컬 절대 경로(사용자명 포함)를 지운다
  - S2 스크립트를 제한하지 않는 최소 CSP와 Permissions-Policy를 모든 경로에 추가한다
  - S3 `npm audit`의 개발 의존성 moderate 경고(minimatch)를 수용하는 이유와 해제 조건을 AGENTS.md에 남긴다
  - S4 GitHub 저장소의 Dependabot 알림(vulnerability alerts)을 켠다
- 유지할 기존 동작: 기존 보안 헤더 3종, `/assets/*` immutable 캐시, 모든 페이지의 하이드레이션·인라인 스크립트, 기존 테스트
- 제외 범위: 인라인 스크립트 hash를 쓰는 완전한 CSP(JS 사이트와 같은 판단), Dependabot 자동 보안 PR, git 이력 재작성, 의존성 버전 변경

## 2. 사실과 추정

### 사실 (점검에서 확인)

- `npm audit --omit=dev`는 0건이다. 전체 audit은 moderate 14건이고, 모두 `minimatch <11.0.1`(GHSA-g3hv-75wg-m249, globparts 증폭 DoS)에서 비롯된다. 설치된 버전은 10.2.6이다.
  - 이 minimatch를 요구하는 쪽: `eslint@10.13.0`(`^10.2.5`), `@eslint/config-array@0.23.5`(`^10.2.4`), `@typescript-eslint/typescript-estree@8.72.0`(`^10.2.2`).
  - `npm audit fix --force`는 `typescript-eslint`를 8.14.0으로 내린다(semver major 변경).
- 배포 응답(`curl -sI`)에는 HSTS(Vercel 기본), `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`가 있다. CSP와 Permissions-Policy는 없다. 설정 위치는 `vercel.json:7-15`.
- 프리렌더 HTML에는 인라인 `<script>` 4개, `type="module"` 1개, `application/ld+json` 1개가 있다. 외부 출처 리소스는 없고, 외부 링크(react.dev, JS 사이트)만 있다.
- 앱에는 `<form>`, `iframe`, `<object>`, `<embed>`, `<base>`가 없다(`app/` grep).
- 위험한 코드 패턴(`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`)은 없다(`app/`, `scripts/` grep). 빌드 결과에 `.map` 파일이 없다. 외부 링크는 모두 `rel="noopener noreferrer"`를 쓴다.
- git 이력에서 비밀 값 패턴을 찾지 못했다. `.gitignore`에 `.env*.local`이 있고, `.env`에는 공개 URL만 있다.
- 저장소는 public이다. GitHub secret scanning과 push protection은 켜져 있고, Dependabot 알림(`/vulnerability-alerts` 404)과 자동 보안 업데이트는 꺼져 있다.
- 로컬 절대 경로는 `.claude/plans/react-uth-initial-setup.md:5` 한 곳뿐이다(로컬 절대 경로 패턴 `git grep`).
- 문서에서 헤더를 언급하는 곳은 `AGENTS.md:131`, `README.md:52`이고, 의존성 경고를 기록하는 곳은 `AGENTS.md:30`(compression override)이다.
- 로컬 `serve`는 `vercel.json`을 읽지 않는다(JS 사이트 보안 리뷰에서 확인한 사실). 그래서 헤더는 배포 후에만 실제로 확인할 수 있다.

## 3. 구현 전략

- S2: `/(.*)` 헤더 규칙에 두 헤더를 추가한다.
  - `Content-Security-Policy: object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`
    - `script-src`·`style-src`·`img-src`·`connect-src`·`default-src`는 넣지 않는다. 그래서 인라인 스크립트, Shiki 인라인 스타일, 하이드레이션에 영향이 없다.
    - `frame-ancestors 'none'`은 `X-Frame-Options: DENY`와 같은 뜻의 CSP 지시어다. 둘 다 둔다.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`. 사이트가 쓰지 않는 강력한 기능을 끈다.
  - 버린 대안: 인라인 스크립트 sha256을 postbuild에서 계산해 페이지별 `<meta>` CSP로 넣는 완전한 CSP. 페이지마다 hash가 달라 관리 비용이 크고, 사용자 입력·인증·외부 스크립트가 없어 효과가 작다.
- S1: 경로를 "스크래치패드 클론"이라는 설명으로 바꾼다. 의미는 유지한다.
- S3: `AGENTS.md:30`의 compression 문장 뒤에 수용 사유와 해제 조건을 한 문장으로 붙인다. 해제 조건은 eslint·typescript-eslint가 minimatch 11.0.1 이상을 쓰는 버전을 내면 업데이트하는 것이다.
- S4: `gh api -X PUT repos/ygvbhy/React-Under-the-Hood/vulnerability-alerts`로 알림만 켠다. 사용자가 점검 결과에서 선택했다.

## 4. 변경 파일

- 수정 `vercel.json` — S2
- 수정 `.claude/plans/react-uth-initial-setup.md:5` — S1
- 수정 `AGENTS.md:30`(S3), `AGENTS.md:131`(S2 헤더 목록), `README.md:52`(S2: 이미 "기본 보안 헤더"로 포괄해서 표현하므로 바꾸지 않을 수 있음)
- 저장소 설정 — S4 (GitHub)
- 변경하지 않음: 앱 코드, 테스트, `package.json`·lock, `serve.json`

## 5. 위험 요소

- CSP가 기존 동작을 막으면 하이드레이션이나 링크가 깨진다. 막는 곳: 지시어를 object·base·form·frame-ancestors로 한정했고, 배포 후 브라우저 콘솔에서 CSP 위반이 0건인지와 퀴즈·시뮬레이터 동작을 확인한다(작업 순서 4).
- `base-uri 'self'`는 앱에 `<base>`가 없어 영향이 없다. `form-action 'self'`도 `<form>`이 없어 영향이 없다.
- 헤더 JSON에 오타가 있으면 Vercel 배포가 실패한다. 막는 곳: JSON 파싱과 Prettier 검사, 배포 후 `curl -sI`로 확인한다.
- Dependabot 알림을 켜면 GitHub이 경고를 보여 준다. minimatch 경고도 알림으로 뜰 수 있는데, 이 경고는 S3에 기록한 대로 수용한 상태다.

## 6. 검증 방법

- 정적: `node -e "JSON.parse(...vercel.json)"`, `npm run format:check`, `npm run lint`. 앱 코드를 바꾸지 않았지만 같은 커밋에 들어갈 도메인 변경과 함께 `npm test`, `npm run test:build`, `npm run e2e`를 한 번 더 돌린다.
- 저장소: `gh api -i repos/ygvbhy/React-Under-the-Hood/vulnerability-alerts`가 204를 돌려준다.
- 배포 후(push 이후): `curl -sI https://react-under-the-hood.vercel.app/`에 CSP와 Permissions-Policy가 있다. 브라우저에서 `/concepts/jsx-to-element`의 콘솔에 CSP 위반이 없고, 퀴즈를 누르고 시뮬레이터에서 '다음'을 눌러도 동작한다.

## 7. 미확정 사항

- [미확정] 헤더의 실제 적용과 CSP 위반 여부는 push 후 배포 응답으로만 확인할 수 있다. 커밋·push는 사용자 확인 후에 한다.

## 8. 작업 순서

### 1. 로컬 경로 제거 (S1)
- 대상: `.claude/plans/react-uth-initial-setup.md:5`
- 완료 조건: 로컬 홈·임시 디렉터리 절대 경로를 찾는 `git grep` 결과가 없다.

### 2. 보안 헤더 (S2)
- 대상: `vercel.json`, `AGENTS.md:131`
- 완료 조건: JSON 파싱 성공, `format:check` 통과, `/(.*)` 규칙에 헤더 5개가 있고 `/assets/(.*)` 규칙이 그대로다.

### 3. 의존성 경고 기록 (S3)
- 대상: `AGENTS.md:30`
- 완료 조건: AGENTS.md에 GHSA-g3hv-75wg-m249, 수용 사유, 해제 조건이 있다.

### 4. Dependabot 알림 (S4)
- 대상: GitHub 저장소 설정
- 완료 조건: `vulnerability-alerts` 응답이 204다.

### 5. 검증
- 6절 정적 검증을 실행한다. 배포 후 확인은 push 뒤에 한다.

## 구현 진행

- baseline (2026-11-03, `6250374` + 도메인 변경): lint·format:check·typecheck 통과, vitest 141, test:build 26, playwright 82 passed·10 skipped
- [x] 1. 로컬 경로 제거 — `react-uth-initial-setup.md:5`를 "스크래치패드에 클론해 사용"으로 바꿈. 로컬 절대 경로 `git grep` 결과 없음(새 계획 문서도 사용자명 문자열 없음)
- [x] 2. 보안 헤더 — `vercel.json` `/(.*)`에 CSP·Permissions-Policy 추가, `/assets/(.*)` 규칙은 그대로. JSON 파싱·format:check 통과. 배포 전 시뮬레이션: 실제 배포 페이지에 새 헤더를 붙여(Playwright route) Chromium에서 열었을 때 하이드레이션, 퀴즈 정답 확인, 시뮬레이터 7단계, 홈→개념 클라이언트 이동이 모두 동작했고 콘솔 오류·CSP 위반 0
- [x] 3. 의존성 경고 기록 — `AGENTS.md` 의존성 규칙에 GHSA-g3hv-75wg-m249 수용 사유와 해제 조건 추가
- [x] 4. Dependabot 알림 — `gh api -X PUT .../vulnerability-alerts` 204, 재조회 204
- [x] 5. 검증 — lint·format:check·typecheck 통과, vitest 141, test:build 26, playwright 82 passed·10 skipped. 배포 후 `curl -sI` 확인은 push 뒤(미확정 1)
- 리뷰(메인 직접): Critical·High 0. 설정·문서만 바뀌었고, CSP 지시어는 앱에 없는 기능(object·base·form·frame)만 제한한다

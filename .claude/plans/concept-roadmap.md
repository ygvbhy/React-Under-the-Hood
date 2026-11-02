# 개념 로드맵

- 상태: 확정(개념 작성 전)
- 작성일: 2026-11-02
- 근거: 2026-11-02 사용자 확정 (`.claude/plans/react-uth-initial-setup.md` 부록 A)

## 규칙

- 위에서 아래 순서로 쓴다. 1부(공개 동작)를 먼저 쓰고, 2부(내부 구현)는 "1부 연결"에 적힌 1부 개념을 쓴 뒤에 쓴다.
- `order` 제안은 번호 × 10이다. 사이에 끼울 때는 사이 번호를 쓴다.
- 카테고리: `rendering` 렌더링 기초, `state` state와 업데이트, `effects` 이벤트·ref·effect, `optimization` 메모이제이션과 Context, `internals` 내부 구현, `concurrency` 동시성.
- JS 연결은 "후보"이며 개념을 쓸 때 JS 사이트(`npm run js-index:sync` 인덱스)에서 실제 slug와 앵커를 확인해 확정한다.
- React 18 차이는 "작성 시 확인"이며 릴리스 노트·업그레이드 가이드로 확인한 것만 `react18` Callout로 쓴다.

## 1부: 공개 동작

| #   | 제목                                                       | 카테고리       | order | JS 연결                                                                                          | React 18 차이                                                |
| --- | ---------------------------------------------------------- | -------------- | ----- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 1   | JSX는 함수 호출이다: element는 그냥 객체                   | `rendering`    | 10    | 후보(개념 작성 시 확정): `function-calls`, `primitives-and-objects`                              | 작성 시 확인 (element의 `ref`)                               |
| 2   | 렌더링은 컴포넌트 함수를 호출하는 것: 트리거 → 렌더 → 커밋 | `rendering`    | 20    | 후보(개념 작성 시 확정): `function-calls`                                                        | -                                                            |
| 3   | 순수 함수와 StrictMode: 왜 두 번 실행될까                  | `rendering`    | 30    | -                                                                                                | 작성 시 확인 (StrictMode 두 번째 렌더의 메모이제이션 재사용) |
| 4   | props는 읽기 전용이다                                      | `rendering`    | 40    | 후보(개념 작성 시 확정): `primitives-and-objects`, `property-attributes`                         | -                                                            |
| 5   | state는 스냅샷이다: setState 직후 값이 그대로인 이유       | `state`        | 50    | 후보(개념 작성 시 확정): `closure`                                                               | -                                                            |
| 6   | 배칭과 함수형 업데이트: `setCount(c => c + 1)`             | `state`        | 60    | 후보(개념 작성 시 확정): `arrow-functions`                                                       | -                                                            |
| 7   | 객체·배열 state: 변경하면 왜 화면이 안 바뀔까              | `state`        | 70    | 후보(개념 작성 시 확정): `equality-operators`, `primitives-and-objects`, `array-method-pitfalls` | -                                                            |
| 8   | 리렌더링은 언제 일어나나: 부모가 렌더되면 자식도           | `rendering`    | 80    | -                                                                                                | -                                                            |
| 9   | state는 트리 위치에 묶인다: 같은 자리 같은 타입이면 유지   | `state`        | 90    | -                                                                                                | -                                                            |
| 10  | 리스트와 key: index key의 함정                             | `state`        | 100   | 후보(개념 작성 시 확정): `array-index-length`                                                    | -                                                            |
| 11  | 이벤트 핸들러: 함수를 넘기는 것과 호출하는 것              | `effects`      | 110   | 후보(개념 작성 시 확정): `this-binding`, `arrow-functions`                                       | -                                                            |
| 12  | ref: 렌더에 영향을 주지 않는 값                            | `effects`      | 120   | 후보(개념 작성 시 확정): `closure`                                                               | 작성 시 확인 (ref를 prop으로, ref cleanup)                   |
| 13  | `useEffect` 실행 시점과 cleanup                            | `effects`      | 130   | 이벤트 루프 페이지 대기(JS 사이트에 아직 없음)                                                   | -                                                            |
| 14  | deps 배열과 stale closure                                  | `effects`      | 140   | 후보(개념 작성 시 확정): `closure`, `equality-operators`                                         | -                                                            |
| 15  | `memo`·`useMemo`·`useCallback`: 무엇을 건너뛰나            | `optimization` | 150   | 후보(개념 작성 시 확정): `equality-operators`                                                    | -                                                            |
| 16  | Context는 리렌더링을 어떻게 퍼뜨리나                       | `optimization` | 160   | -                                                                                                | 작성 시 확인 (`<Context>`를 Provider로)                      |

## 2부: 내부 구현 (v19.3.1 소스 기준)

| #   | 제목                                                         | 카테고리      | order | 1부 연결 | React 18 차이 |
| --- | ------------------------------------------------------------ | ------------- | ----- | -------- | ------------- |
| 17  | Fiber 노드: child·sibling·return으로 이어진 트리             | `internals`   | 170   | 2, 9     | -             |
| 18  | current와 workInProgress: 이중 버퍼                          | `internals`   | 180   | 2        | -             |
| 19  | 렌더 단계와 커밋 단계: work loop                             | `internals`   | 190   | 2, 13    | -             |
| 20  | hooks 연결 리스트: 호출 순서 규칙이 있는 이유                | `internals`   | 200   | 5, 12    | -             |
| 21  | 업데이트 큐: setState는 어디에 쌓이나                        | `internals`   | 210   | 5, 6     | -             |
| 22  | 자식 재조정: type과 key 비교                                 | `internals`   | 220   | 9, 10    | -             |
| 23  | lanes: 업데이트의 우선순위                                   | `concurrency` | 230   | 6        | -             |
| 24  | transition과 `useDeferredValue`                              | `concurrency` | 240   | 23       | -             |
| 25  | Suspense: 렌더 중에 기다리기                                 | `concurrency` | 250   | 19       | -             |
| 26  | 합성 이벤트와 루트 위임                                      | `internals`   | 260   | 11       | -             |
| 27  | React 19 Actions: `useActionState`, `useOptimistic`, `use()` | `concurrency` | 270   | 24, 25   | 작성 시 확인  |

## 범위 밖

- Server Components
- React Compiler
- `useSyncExternalStore`
- 포털
- 에러 경계

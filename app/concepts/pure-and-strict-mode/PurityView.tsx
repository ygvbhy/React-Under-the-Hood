import { useId, type ReactNode } from 'react'
import type { PurityState, TicketCall } from './scenarios'

type Props = {
  state: PurityState
}

const wrap = 'break-words'

function Area({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <p id={id} className="text-muted mb-1 text-sm font-semibold">
        {title}
      </p>
      {children}
    </section>
  )
}

// Ticket 위치별로 호출을 묶는다(호출된 순서 유지).
function groupByPosition(calls: TicketCall[]): { position: number; calls: TicketCall[] }[] {
  const groups: { position: number; calls: TicketCall[] }[] = []
  for (const c of calls) {
    const group = groups.find((g) => g.position === c.position)
    if (group) group.calls.push(c)
    else groups.push({ position: c.position, calls: [c] })
  }
  return groups
}

// 한 단계의 상태(바깥 변수, 컴포넌트 호출 기록, 화면)를 그린다. 교육용 그림이다.
// "두 결과 같음/다름" 배지는 이 그림에서만 하는 비교이며 React가 비교하는 것이 아니다.
export function PurityView({ state }: Props) {
  const uid = useId()
  return (
    <div className="space-y-4">
      <Area id={`${uid}-outer`} title="바깥 변수">
        {state.outer === null ? (
          <p className="text-muted text-sm">이 예제는 바깥 변수를 쓰지 않습니다</p>
        ) : (
          <p
            className={`border-border bg-surface rounded-md border px-2 py-1 font-mono text-sm ${wrap}`}
          >
            {state.outer.value === null ? (
              <>
                {state.outer.name} <span className="text-muted">아직 선언 전</span>
              </>
            ) : (
              `${state.outer.name} = ${state.outer.value}`
            )}
          </p>
        )}
      </Area>

      <Area id={`${uid}-calls`} title="컴포넌트 호출 기록">
        {state.calls.length === 0 ? (
          <p className="text-muted text-sm">아직 호출한 컴포넌트 없음</p>
        ) : (
          <ol className="space-y-2">
            {groupByPosition(state.calls).map((g) => {
              const both = g.calls.length === 2
              const same = both && g.calls[0].returns === g.calls[1].returns
              return (
                <li
                  key={g.position}
                  data-position={g.position}
                  className="border-accent bg-highlight min-w-0 rounded-md border px-2 py-1 text-sm"
                >
                  <p className={`font-mono font-semibold ${wrap}`}>{g.position}번째 Ticket</p>
                  <ul className="mt-1 space-y-1">
                    {g.calls.map((c) => (
                      <li key={c.call} data-call={c.call} className="min-w-0">
                        <span className="text-muted">{c.call}번째 호출이 돌려준 JSX </span>
                        <span className={`font-mono ${wrap}`}>{c.returns}</span>
                      </li>
                    ))}
                  </ul>
                  {both ? (
                    <p
                      data-same={same ? 'true' : 'false'}
                      className="border-accent mt-1 inline-block rounded border px-1 text-xs font-semibold"
                    >
                      {same ? '두 결과 같음' : '두 결과 다름'}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ol>
        )}
      </Area>

      <Area id={`${uid}-screen`} title="화면 (#root의 li)">
        <div className="border-border bg-surface min-h-10 min-w-0 rounded-lg border px-3 py-2 text-sm">
          {state.screen === null ? (
            <span className="text-muted">비어 있음</span>
          ) : (
            <ul className="space-y-1">
              {state.screen.map((text, i) => (
                <li key={i} className={`min-w-0 font-mono ${wrap}`}>
                  {text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Area>
    </div>
  )
}

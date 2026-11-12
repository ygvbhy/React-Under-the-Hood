import { useId, type ReactNode } from 'react'
import type { Phase, RenderCommitState } from './scenarios'

type Props = {
  state: RenderCommitState
}

const wrap = 'break-words'

const phases: { phase: Exclude<Phase, 'idle'>; label: string }[] = [
  { phase: 'trigger', label: '트리거' },
  { phase: 'render', label: '렌더' },
  { phase: 'commit', label: '커밋' },
]

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

// 한 단계의 상태(단계 표시, 트리거, 호출한 컴포넌트, #root의 DOM)를 그린다. 교육용 그림이다.
export function RenderCommitView({ state }: Props) {
  const uid = useId()
  return (
    <div className="space-y-4">
      <Area id={`${uid}-phase`} title="단계 표시">
        <ol className="flex min-w-0 flex-wrap gap-2">
          {phases.map((p) => {
            const current = state.phase === p.phase
            return (
              <li
                key={p.phase}
                data-phase={p.phase}
                data-current={current ? 'true' : undefined}
                aria-current={current ? 'step' : undefined}
                className={`rounded-md border px-2 py-1 text-sm ${
                  current
                    ? 'border-accent bg-highlight font-bold'
                    : 'border-border bg-surface text-muted'
                }`}
              >
                {p.label}
                {current ? <span className="ml-1">현재</span> : null}
              </li>
            )
          })}
        </ol>
        {state.phase === 'idle' ? <p className="text-muted mt-1 text-sm">대기 중</p> : null}
      </Area>

      <Area id={`${uid}-trigger`} title="트리거">
        {state.trigger === null ? (
          <p className="text-muted text-sm">없음</p>
        ) : (
          <p
            className={`border-border bg-surface rounded-md border px-2 py-1 font-mono text-sm ${wrap}`}
          >
            {state.trigger}
          </p>
        )}
      </Area>

      <Area id={`${uid}-rendered`} title="이번 렌더에서 호출한 컴포넌트">
        {state.rendered.length === 0 ? (
          <p className="text-muted text-sm">이번 렌더에서 호출한 컴포넌트 없음</p>
        ) : (
          <ol className="space-y-1">
            {state.rendered.map((c, i) => (
              <li
                key={i}
                data-component={c.name}
                className="border-accent bg-highlight min-w-0 rounded-md border px-2 py-1 text-sm"
              >
                <span className={`font-mono font-semibold ${wrap}`}>{c.name}</span>
                <span className="text-muted"> 돌려준 JSX </span>
                <span className={`font-mono ${wrap}`}>{c.returns}</span>
              </li>
            ))}
          </ol>
        )}
      </Area>

      <Area id={`${uid}-dom`} title="#root의 DOM">
        <div className="border-border bg-surface min-h-10 min-w-0 rounded-lg border px-3 py-2 text-sm">
          {state.dom === null ? (
            <span className="text-muted">비어 있음</span>
          ) : (
            <ul className="space-y-1">
              {state.dom.map((d, i) => (
                <li
                  key={i}
                  data-changed={d.changed ? 'true' : undefined}
                  style={{ paddingLeft: `${d.depth * 1.25}rem` }}
                  className="min-w-0"
                >
                  <span
                    className={`inline-block max-w-full rounded px-1 font-mono ${wrap} ${
                      d.changed ? 'bg-highlight border-accent border' : ''
                    }`}
                  >
                    {d.label}
                  </span>
                  {d.changed ? (
                    <span className="border-accent ml-2 rounded border px-1 text-xs font-semibold">
                      바뀜
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Area>
    </div>
  )
}

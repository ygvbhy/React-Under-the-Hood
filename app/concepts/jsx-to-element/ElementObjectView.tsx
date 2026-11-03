import { useId, type ReactNode } from 'react'
import type { ElementSimState, ElementView } from './scenarios'

type Props = {
  state: ElementSimState
}

const wrap = 'break-words'
const rowClass = 'flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-sm'
const labelClass = 'text-muted shrink-0'

// 태그면 따옴표를 포함한 문자열('"section"'), 컴포넌트면 함수 이름
function typeLabel(type: string): string {
  return type.startsWith('"') ? `태그 이름 ${type}` : `컴포넌트 함수 ${type}`
}

function ChildValue({ child }: { child: ElementView | string }) {
  if (typeof child === 'string') {
    return (
      <li className="border-border bg-surface rounded-md border px-2 py-1 text-sm">
        <span className={labelClass}>문자열</span>{' '}
        <span className={`font-mono ${wrap}`}>{child}</span>
      </li>
    )
  }
  return (
    <li className="min-w-0">
      <ElementCard element={child} />
    </li>
  )
}

function PropValue({ value }: { value: string | ElementView | (ElementView | string)[] }) {
  if (typeof value === 'string') {
    return <span className={`font-mono ${wrap}`}>{value}</span>
  }
  if (Array.isArray(value)) {
    return (
      <ul className="mt-1 w-full min-w-0 space-y-1">
        {value.map((child, i) => (
          <ChildValue key={i} child={child} />
        ))}
      </ul>
    )
  }
  return (
    <div className="mt-1 w-full min-w-0">
      <ElementCard element={value} />
    </div>
  )
}

function ElementCard({ element }: { element: ElementView }) {
  return (
    <div
      data-element-type={element.type}
      className="border-border bg-surface min-w-0 rounded-lg border-2 px-3 py-2"
    >
      <p className={rowClass}>
        <span className={labelClass}>type</span>
        <span className={`font-mono font-semibold ${wrap}`}>{typeLabel(element.type)}</span>
      </p>
      <p className={rowClass}>
        <span className={labelClass}>key</span>
        <span className={`font-mono ${wrap}`}>{element.key === null ? 'null' : element.key}</span>
      </p>
      <div className="mt-1 min-w-0">
        <p className={labelClass + ' text-sm'}>props</p>
        {element.props.length === 0 ? (
          <p className="text-muted text-sm">props 없음</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {element.props.map((p) => (
              <li
                key={p.name}
                className="border-border bg-bg flex min-w-0 flex-wrap gap-x-2 gap-y-1 rounded-md border px-2 py-1 text-sm"
              >
                <span className={`font-mono font-semibold ${wrap}`}>{p.name}</span>
                <PropValue value={p.value} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

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

// 한 단계의 상태(변수의 element 카드, 컴포넌트 호출 기록, #root)를 그린다. 교육용 그림이다.
export function ElementObjectView({ state }: Props) {
  const uid = useId()
  return (
    <div className="space-y-4">
      <Area id={`${uid}-vars`} title="변수">
        {state.variables.length === 0 ? (
          <p className="text-muted text-sm">아직 만든 element가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {state.variables.map((v) => (
              <li key={v.name} data-variable={v.name} className="min-w-0">
                <p className={`mb-1 font-mono font-semibold ${wrap}`}>{v.name}</p>
                <ElementCard element={v.value} />
              </li>
            ))}
          </ul>
        )}
      </Area>

      <Area id={`${uid}-calls`} title="컴포넌트 호출 기록">
        {state.calls.length === 0 ? (
          <p className="text-muted text-sm">아직 호출되지 않음</p>
        ) : (
          <ul className="space-y-1">
            {state.calls.map((c, i) => (
              <li
                key={i}
                className={`border-accent bg-highlight rounded-md border px-2 py-1 font-mono text-sm ${wrap}`}
              >
                {c}
              </li>
            ))}
          </ul>
        )}
      </Area>

      <Area id={`${uid}-root`} title="#root">
        <div
          className={`border-border bg-surface min-h-10 rounded-lg border px-3 py-2 font-mono text-sm ${wrap}`}
        >
          {state.root === null ? <span className="text-muted">비어 있음</span> : state.root}
        </div>
      </Area>
    </div>
  )
}

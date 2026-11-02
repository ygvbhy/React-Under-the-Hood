import { format } from 'node:util'
import { vi } from 'vitest'

type Interaction = { type: 'click'; selector: string }

// 주의: 저장소에 포함된 신뢰된 예제만 실행한다. jsdom 전역(document, window)이 있는 환경에서 호출해야 한다.
// 예제 모듈을 import해 #root에 렌더하고, console.log 출력을 줄 단위로 수집한다.
// 렌더·effect·핸들러의 예외는 React가 가로채므로 console.error와 window error 이벤트도 errors로 모은다.
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

async function settle(output: string[], errors: string[]) {
  for (let i = 0; i < 20; i++) await tick()
  const outputLength = output.length
  const errorsLength = errors.length
  for (let i = 0; i < 5; i++) await tick()
  if (output.length > outputLength || errors.length > errorsLength) {
    errors.push('settle되지 않음: 대기 후에도 출력이 계속 늘어납니다')
  }
}

export async function runReactExample(
  absPath: string,
  interactions: Interaction[] = [],
): Promise<{ output: string[]; errors: string[] }> {
  const output: string[] = []
  const errors: string[] = []

  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false
  document.body.innerHTML = '<div id="root"></div>'
  vi.resetModules()

  const logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    const first = args[0]
    if (typeof first === 'string' && first.includes('%')) {
      errors.push(`"%"는 쓸 수 없습니다: ${first}`)
    }
    output.push(args.map(String).join(' '))
  })
  const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(format(...args))
  })
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    errors.push(format(...args))
  })
  const onError = (event: ErrorEvent) => errors.push(`error: ${event.message}`)
  const onRejection = (event: PromiseRejectionEvent) =>
    errors.push(`unhandledrejection: ${String(event.reason)}`)
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)

  try {
    await import(/* @vite-ignore */ absPath)
    await settle(output, errors)
    for (const interaction of interactions) {
      const element = document.querySelector<HTMLElement>(interaction.selector)
      if (!element) {
        errors.push(`상호작용 대상을 찾을 수 없습니다: ${interaction.selector}`)
        break
      }
      element.click()
      await settle(output, errors)
    }
  } finally {
    logSpy.mockRestore()
    errorSpy.mockRestore()
    warnSpy.mockRestore()
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
  }
  return { output, errors }
}

import type { ConsoleMessage, Page } from '@playwright/test'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ConceptMeta } from '~/lib/concepts'

// 첫 개념(참고 구현)의 경로와 시뮬레이터 영역 이름
export const CONCEPT_PATH = '/concepts/jsx-to-element'
export const SIMULATOR_NAME = 'JSX element 시뮬레이터'

// 404 문서 자체를 받을 때 브라우저가 남기는 리소스 로드 로그. 앱 오류가 아니므로 무시한다.
const IGNORED_404_LOG = /Failed to load resource: the server responded with a status of 404/

export type ConsoleErrors = { readonly messages: string[] }

// 콘솔 error와 처리되지 않은 예외(pageerror)를 모은다. 하이드레이션 경고·오류도 여기에 잡힌다.
export function collectConsoleErrors(page: Page, options: { ignore404Resource?: boolean } = {}) {
  const messages: string[] = []
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return
    if (options.ignore404Resource && IGNORED_404_LOG.test(msg.text())) return
    messages.push(`console.error: ${msg.text()}`)
  })
  page.on('pageerror', (error) => {
    messages.push(`pageerror: ${error.message}`)
  })
  return { messages } satisfies ConsoleErrors
}

// 프리렌더된 HTML은 JS가 붙기 전에도 보이므로, 클릭·입력 전에 React 하이드레이션이 끝났는지 확인한다.
// React는 하이드레이션 중 DOM 노드에 내부 fiber 키를 붙인다.
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector('h1')
    return !!el && Object.keys(el).some((key) => key.startsWith('__reactFiber'))
  })
}

export type ConceptSummary = { slug: string; title: string; summary: string; tags: string[] }

// app/concepts의 meta.ts를 동적 import해 order 오름차순으로 돌려 준다.
// `~/lib/concepts`는 import.meta.glob을 써서 Playwright(Node)에서 쓸 수 없으므로 타입만 가져온다.
// 개념 수·순서·제목은 여기서 계산하므로 개념을 추가해도 e2e를 고치지 않는다.
export async function loadConceptsByOrder(): Promise<ConceptSummary[]> {
  const conceptsDir = join(process.cwd(), 'app', 'concepts')
  const metas: ConceptMeta[] = []
  for (const slug of readdirSync(conceptsDir).sort()) {
    const dir = join(conceptsDir, slug)
    const metaPath = join(dir, 'meta.ts')
    if (!statSync(dir).isDirectory() || !existsSync(metaPath)) continue
    const { concept } = (await import(pathToFileURL(metaPath).href)) as { concept: ConceptMeta }
    metas.push(concept)
  }
  return metas
    .sort((a, b) => a.order - b.order)
    .map(({ slug, title, summary, tags }) => ({ slug, title, summary, tags }))
}

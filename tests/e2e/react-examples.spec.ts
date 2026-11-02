import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import type { Server } from 'node:http'
import { join, relative } from 'node:path'
import { expect, test, type ConsoleMessage } from '@playwright/test'
import type { PreviewServer } from 'vite'
import { collectReactExampleCases } from '../helpers/react-example-cases'

// jsdom 실행기(tests/react-examples.test.ts)와 같은 케이스를 실제 Chromium에서 실행해 기대값과 대조한다.
// 예제마다 HTML을 만들어 Vite 개발 빌드로 묶고, vite.preview로 띄워 실제 클릭으로 조작한다.
const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'test-results', 'react-examples')
const SRC_DIR = join(OUT_DIR, 'src')
const DIST_DIR = join(OUT_DIR, 'dist')
const PORT = 4174
const QUIET_MS = 300
const MAX_WAIT_MS = 5000

const cases = (await collectReactExampleCases()).filter((c) => c.errors !== 'expect-violation')

// fullyParallel에서도 beforeAll이 워커마다 돌지 않도록 desktop 한 곳에서만 빌드한다.
test.describe.configure({ mode: 'default' })

let server: PreviewServer | undefined

// Playwright는 첫 인자가 구조 분해 패턴이어야 한다.
// eslint-disable-next-line no-empty-pattern
test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Chromium 교차 검증은 desktop에서 한 번만')
  test.setTimeout(120_000)

  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(SRC_DIR, { recursive: true })
  const input: Record<string, string> = {}
  cases.forEach((c, i) => {
    const htmlPath = join(SRC_DIR, `${i}.html`)
    const scriptSrc = `/${relative(ROOT, c.absPath).split('\\').join('/')}`
    writeFileSync(
      htmlPath,
      `<!doctype html><html><body><div id="root"></div><script type="module" src="${scriptSrc}"></script></body></html>`,
    )
    input[String(i)] = htmlPath
  })

  const { build, preview } = await import('vite')
  console.log(`[react-examples] vite build (${cases.length} cases)`)
  await build({
    configFile: false,
    root: ROOT,
    mode: 'development',
    logLevel: 'error',
    // define이 없으면 mode와 상관없이 프로덕션 React가 묶인다.
    define: { 'process.env.NODE_ENV': '"development"' },
    build: { outDir: DIST_DIR, emptyOutDir: true, minify: false, rollupOptions: { input } },
  })
  server = await preview({
    configFile: false,
    root: ROOT,
    logLevel: 'error',
    build: { outDir: DIST_DIR },
    preview: { port: PORT, strictPort: true },
  })
})

test.afterAll(async () => {
  await new Promise<void>((resolve) => {
    if (!server) return resolve()
    const httpServer = server.httpServer as Server
    httpServer.close(() => resolve())
    httpServer.closeAllConnections()
  })
})

cases.forEach((c, i) => {
  test(c.name, async ({ page }) => {
    const messages: { type: string; text: string }[] = []
    const pageErrors: string[] = []
    let lastActivity = Date.now()
    page.on('console', (msg: ConsoleMessage) => {
      messages.push({ type: msg.type(), text: msg.text() })
      lastActivity = Date.now()
    })
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
      lastActivity = Date.now()
    })

    // 새 콘솔 메시지가 QUIET_MS 동안 없을 때까지 기다린다(최대 MAX_WAIT_MS).
    const settle = async () => {
      const start = Date.now()
      lastActivity = Date.now()
      while (Date.now() - start < MAX_WAIT_MS && Date.now() - lastActivity < QUIET_MS) {
        await page.waitForTimeout(50)
      }
    }

    const htmlUrl = `http://localhost:${PORT}/${relative(ROOT, join(SRC_DIR, `${i}.html`))}`
    await page.goto(htmlUrl)
    await settle()
    for (const interaction of c.interactions) {
      await page.click(interaction.selector)
      await settle()
    }

    expect(messages.filter((m) => m.type === 'log').map((m) => m.text)).toEqual(c.expectedOutput)
    expect(messages.filter((m) => m.type === 'error' || m.type === 'warning')).toEqual([])
    expect(pageErrors).toEqual([])
    // 개발 빌드 React만 이 메시지를 낸다.
    expect(
      messages.some((m) => m.type === 'info' && m.text.includes('Download the React DevTools')),
    ).toBe(true)
  })
})

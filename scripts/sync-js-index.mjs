// JS Under the Hood의 개념 slug와 h2/h3 제목 앵커 id를 읽어 app/lib/js-site-index.json에 쓴다(수동 실행).
//   npm run js-index:sync
// 테스트(tests/content-integrity.test.ts)는 네트워크 없이 이 스냅샷으로 JsLink·jsPrerequisites를 검사한다.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const jsSiteSource = readFileSync(new URL('../app/lib/js-site.ts', import.meta.url), 'utf8')
const urlMatch = jsSiteSource.match(/export const JS_SITE_URL =\s*'([^']+)'/)
if (!urlMatch) throw new Error('app/lib/js-site.ts에서 JS_SITE_URL을 찾지 못했습니다')
const JS_SITE_URL = urlMatch[1]
const OUT = fileURLToPath(new URL('../app/lib/js-site-index.json', import.meta.url))

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} 요청 실패: ${res.status}`)
  return res.text()
}

function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

const sitemap = await fetchText(`${JS_SITE_URL}/sitemap.xml`)
const slugs = [
  ...new Set([...sitemap.matchAll(/\/concepts\/([^/<\s"]+)/g)].map((m) => m[1])),
].sort()
if (slugs.length === 0) throw new Error('sitemap.xml에서 개념 URL을 찾지 못했습니다')

const concepts = {}
for (const slug of slugs) {
  const html = await fetchText(`${JS_SITE_URL}/concepts/${slug}`)
  const ids = [...html.matchAll(/<h[23](?:\s[^>]*)?\sid="([^"]+)"/g)].map((m) =>
    decodeEntities(m[1]),
  )
  concepts[slug] = ids
}

const syncedAt = new Date().toISOString().slice(0, 10)
writeFileSync(OUT, JSON.stringify({ source: JS_SITE_URL, syncedAt, concepts }, null, 2) + '\n')
execFileSync('npx', ['prettier', '--write', OUT], { stdio: 'inherit' })
console.log(`${slugs.length}개 개념을 ${OUT}에 기록했습니다`)

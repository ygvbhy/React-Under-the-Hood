import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { listConcepts, sortByOrder } from '~/lib/concepts'
import { OG_IMAGE_HEIGHT, OG_IMAGE_URL, OG_IMAGE_WIDTH } from '~/lib/seo'
import { SITE_NAME, SITE_URL } from '~/lib/site'

// L5: 프리렌더·SEO 빌드 결과. `npm run build` 이후의 build/client를 검사한다.
const clientDir = join(process.cwd(), 'build', 'client')
const read = (path: string) => readFileSync(join(clientDir, path), 'utf8')

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

const htmlToText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

// content.mdx에서 첫 번째 평문 문장(마크다운 기호 제외)을 뽑아 본문 렌더 여부를 확인한다.
function firstProseLine(slug: string): string {
  const mdx = readFileSync(join(process.cwd(), 'app', 'concepts', slug, 'content.mdx'), 'utf8')
  let inFence = false
  for (const raw of mdx.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('```')) inFence = !inFence
    if (inFence || !line || /^(#|import |export |<|```|[-*>|]|\d+\.)/.test(line)) continue
    return line
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[`*_]/g, '')
      .trim()
  }
  throw new Error(`${slug}/content.mdx에서 본문 문장을 찾지 못했습니다`)
}

const concepts = listConcepts()

// 레지스트리(import.meta.glob)가 옛 파일 목록에 얼어붙으면 새 개념이 조용히 검사에서 빠진다
describe('개념 레지스트리', () => {
  it('개념 수가 app/concepts의 폴더 수와 같다', () => {
    const folders = readdirSync(join(process.cwd(), 'app', 'concepts'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    expect(concepts).toHaveLength(folders.length)
  })
})

describe('개념 상세 HTML', () => {
  it.each(concepts.map((c) => [c.slug, c] as const))('%s', (slug, concept) => {
    const html = read(`concepts/${slug}/index.html`)
    const text = htmlToText(html)
    expect(html).toContain(`<title>${escapeHtml(`${concept.title} | ${SITE_NAME}`)}</title>`)
    expect(text).toContain(firstProseLine(slug))
    expect(html).toContain('class="shiki')
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/concepts/${slug}"`)
    expect(html).toContain('property="og:title"')
    expect(html).toContain('lang="ko"')
    for (const heading of ['동작 원리', '예제', '결과와 이유']) {
      expect(text).toContain(heading)
    }
    // ConceptLayout이 메타데이터로 그리는 섹션 (선행 개념은 prerequisites·jsPrerequisites가 있는 개념만)
    const sections = ['학습 목표', '이 글에서 단순화한 부분', '참고 자료']
    if (concept.prerequisites.length + concept.jsPrerequisites.length > 0)
      sections.push('선행 개념')
    for (const heading of sections) {
      expect(html).toMatch(new RegExp(`<h2[^>]*>${heading}</h2>`))
    }
    // PredictQuiz를 쓰는 개념은 하이드레이션 전 마크업(JS 없이 정답 열람 가능)이 있어야 한다
    const mdx = readFileSync(join(process.cwd(), 'app', 'concepts', slug, 'content.mdx'), 'utf8')
    if (mdx.includes('<PredictQuiz')) expect(html).toContain('<details')
  })
})

// 시뮬레이터는 프리렌더 HTML에 단계 0 상태가 정적으로 들어 있어야 하고,
// 본문보다 넓은 블록으로 배치되도록 .concept-body의 직계 자식이어야 한다(app.css의 [data-wide] 규칙).
// React가 텍스트 노드 사이에 넣는 주석(<!-- -->)은 htmlToText가 태그와 함께 제거한다.
describe('시뮬레이터 프리렌더 (jsx-to-element)', () => {
  const html = read('concepts/jsx-to-element/index.html')
  const text = htmlToText(html)

  it('단계 1(실행 전) 텍스트와 빈 상태 문구가 HTML에 있다', () => {
    expect(text).toContain('단계 1: 실행 전')
    expect(text).toContain('아직 만든 element가 없습니다.')
    expect(text).toContain('아직 호출되지 않음')
    expect(text).toContain('비어 있음')
    expect(text).toContain('(아직 출력 없음)')
  })

  it('시뮬레이터 루트가 data-wide 영역이고 .concept-body의 직계 자식이다', () => {
    const region = html.match(
      /<div[^>]*role="region"[^>]*aria-label="JSX element 시뮬레이터"[^>]*>/,
    )
    expect(region, '시뮬레이터 region이 없습니다').not.toBeNull()
    expect(region![0]).toContain('data-wide')
    // .concept-body 안에서 div 깊이가 0인 위치(직계 자식)여야 하고, <p>로 감싸이면 안 된다
    const bodyOpen = '<div class="concept-body">'
    const bodyStart = html.indexOf(bodyOpen)
    expect(bodyStart).toBeGreaterThan(-1)
    const between = html.slice(bodyStart + bodyOpen.length, region!.index)
    const opens = between.match(/<div[\s>]/g)?.length ?? 0
    const closes = between.match(/<\/div>/g)?.length ?? 0
    expect(opens - closes, '시뮬레이터가 .concept-body의 직계 자식이 아닙니다').toBe(0)
    expect(between.trimEnd().endsWith('<p>')).toBe(false)
  })

  it('두 시나리오 선택 라디오가 있다', () => {
    for (const label of ['JSX와 createElement', '중첩된 JSX']) {
      expect(text).toContain(label)
    }
    expect(html.match(/type="radio"/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('퀴즈 3개의 정답이 <details>로 프리렌더된다', () => {
    expect(html.match(/<details/g)?.length).toBeGreaterThanOrEqual(3)
  })

  it('결과 표의 props.children이 HTML에 있다', () => {
    expect(text).toContain('props.children')
  })
})

describe('홈·소개 HTML', () => {
  it('홈에 모든 개념 제목과 링크가 있다', () => {
    const html = read('index.html')
    for (const c of concepts) {
      expect(html).toContain(escapeHtml(c.title))
      expect(html).toContain(`href="/concepts/${c.slug}"`)
    }
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/"`)
  })

  it('소개 페이지에 정확성 정책 앵커가 있다', () => {
    const html = read('about/index.html')
    expect(html).toContain('id="accuracy"')
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/about"`)
  })
})

describe('404', () => {
  it('404.html이 있고 noindex다', () => {
    expect(existsSync(join(clientDir, '404.html'))).toBe(true)
    expect(read('404.html')).toContain('noindex')
  })

  it('__spa-fallback.html은 없다', () => {
    expect(existsSync(join(clientDir, '__spa-fallback.html'))).toBe(false)
  })
})

describe('OG 이미지', () => {
  const pages = [
    'index.html',
    'about/index.html',
    '404.html',
    ...concepts.map((c) => `concepts/${c.slug}/index.html`),
  ]

  it.each(pages)('%s에 og:image·twitter:card 메타가 있다', (page) => {
    const html = read(page)
    expect(html).toContain(`<meta property="og:image" content="${OG_IMAGE_URL}"`)
    expect(html).toContain(`<meta property="og:image:width" content="${OG_IMAGE_WIDTH}"`)
    expect(html).toContain(`<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}"`)
    expect(html).toContain('property="og:image:alt"')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"')
  })

  it('og-default.png가 1200×630 PNG이고 200KB 미만이다', () => {
    expect(existsSync(join(clientDir, 'og-default.png'))).toBe(true)
    const png = readFileSync(join(clientDir, 'og-default.png'))
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG')
    // IHDR: 바이트 16~23에 너비·높이(big-endian)
    expect(png.readUInt32BE(16)).toBe(OG_IMAGE_WIDTH)
    expect(png.readUInt32BE(20)).toBe(OG_IMAGE_HEIGHT)
    expect(png.length).toBeLessThan(200 * 1024)
  })
})

const LD_JSON_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
const ldJsonBodies = (html: string) => [...html.matchAll(LD_JSON_RE)].map((m) => m[1])

describe('구조화 데이터(JSON-LD)', () => {
  it.each(concepts.map((c) => [c.slug, c] as const))(
    '%s는 TechArticle JSON-LD 1개를 가진다',
    (slug, concept) => {
      const bodies = ldJsonBodies(read(`concepts/${slug}/index.html`))
      expect(bodies).toHaveLength(1)
      const data = JSON.parse(bodies[0])
      expect(data['@type']).toBe('TechArticle')
      expect(data.headline).toBe(concept.title)
      expect(data.url).toBe(`${SITE_URL}/concepts/${slug}`)
      expect(data.inLanguage).toBe('ko')
      if (concept.reviewedAt === null) {
        expect('dateModified' in data).toBe(false)
      } else {
        expect(data.dateModified).toBe(concept.reviewedAt)
      }
    },
  )

  it('홈은 WebSite JSON-LD 1개를 가진다', () => {
    const bodies = ldJsonBodies(read('index.html'))
    expect(bodies).toHaveLength(1)
    const data = JSON.parse(bodies[0])
    expect(data['@type']).toBe('WebSite')
    expect(data.url).toBe(`${SITE_URL}/`)
  })

  it.each(['about/index.html', '404.html'])('%s에는 JSON-LD가 없다', (page) => {
    expect(ldJsonBodies(read(page))).toHaveLength(0)
  })
})

describe('sitemap.xml·robots.txt', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  it('홈, 소개, 모든 개념 URL을 포함한다', () => {
    expect(locs).toContain(`${SITE_URL}/`)
    expect(locs).toContain(`${SITE_URL}/about`)
    for (const c of concepts) expect(locs).toContain(`${SITE_URL}/concepts/${c.slug}`)
  })

  it('404는 포함하지 않는다', () => {
    expect(locs.some((u) => u.includes('/404'))).toBe(false)
  })

  it('robots.txt에 Sitemap 줄이 있다', () => {
    const robots = read('robots.txt')
    expect(robots).toContain('User-agent: *')
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })

  const sitemap = read('sitemap.xml')
  const urlElement = (loc: string) => {
    const el = sitemap.match(new RegExp(`<url><loc>${loc}</loc>[\\s\\S]*?</url>`))
    expect(el, `${loc} 항목이 sitemap에 없습니다`).not.toBeNull()
    return el![0]
  }

  it.each(concepts.map((c) => [c.slug, c] as const))(
    '%s의 lastmod는 reviewedAt과 같다',
    (slug, concept) => {
      const el = urlElement(`${SITE_URL}/concepts/${slug}`)
      if (concept.reviewedAt === null) expect(el).not.toContain('<lastmod>')
      else expect(el).toContain(`<lastmod>${concept.reviewedAt}</lastmod>`)
    },
  )

  it('홈과 소개 항목에는 lastmod가 없다', () => {
    expect(urlElement(`${SITE_URL}/`)).not.toContain('<lastmod>')
    expect(urlElement(`${SITE_URL}/about`)).not.toContain('<lastmod>')
  })
})

// 학습 순서 이전/다음: 관련 개념 링크와 섞이지 않도록 nav 영역만 잘라 검사한다.
describe('학습 순서 pager', () => {
  const ordered = sortByOrder(concepts)
  const navHtml = (slug: string) => {
    const html = read(`concepts/${slug}/index.html`)
    const start = html.indexOf('<nav aria-label="학습 순서"')
    expect(start).toBeGreaterThanOrEqual(0)
    return html.slice(start, html.indexOf('</nav>', start))
  }
  const hrefs = (nav: string) => [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1])

  it.each(ordered.map((c, i) => [c.slug, i] as const))('%s', (slug, i) => {
    const nav = navHtml(slug)
    expect(nav).toContain(`학습 순서 <!-- -->${i + 1}<!-- --> / <!-- -->${ordered.length}`)
    const expected = [ordered[i - 1], ordered[i + 1]]
      .filter((c) => c !== undefined)
      .map((c) => `/concepts/${c.slug}`)
    expect(hrefs(nav)).toEqual(expected)
  })
})

export type ConceptCategory =
  'rendering' | 'state' | 'effects' | 'optimization' | 'internals' | 'concurrency'

export type ConceptMeta = {
  slug: string // 폴더명과 동일 (테스트)
  title: string
  summary: string // 카드·meta description, ≤160자 (테스트)
  category: ConceptCategory
  order: number // 학습 순서(양의 정수). 10 간격, slug 있는 선수 개념보다 커야 함 (테스트)
  tags: string[]
  goals: string[] // ≥1
  prerequisites: { label: string; slug?: string }[] // slug 있으면 존재 검사, 자기 자신 금지
  jsPrerequisites: { label: string; slug: string; anchor?: string }[] // JS Under the Hood 개념 링크. 없으면 [] (인덱스 존재 검사, 테스트)
  related: string[] // 존재하는 slug만
  examples: {
    id: string
    file: string // examples/ 하위 .jsx 파일명
    runtime: 'react-dom' // jsdom(Vitest)과 Chromium(Playwright)에서 createRoot로 #root에 렌더
    interactions?: { type: 'click'; selector: string }[] // 렌더 후 순서대로 실행
    expectedOutput: string[] // console.log 줄 단위
  }[]
  simplifications: string[] // ≥1 (단순화가 없으면 그 사유를 1줄로)
  references: { label: string; url: string }[] // ≥1
  reviewedAt: string | null // YYYY-MM-DD, null이면 "검토 중" 배지
}

export const CATEGORY_LABELS: Record<ConceptCategory, string> = {
  rendering: '렌더링 기초',
  state: 'state와 업데이트',
  effects: '이벤트·ref·effect',
  optimization: '메모이제이션과 Context',
  internals: '내부 구현',
  concurrency: '동시성',
}

// 개념 폴더의 meta.ts는 순수 데이터라 홈 청크에 본문·시뮬레이터가 딸려오지 않는다.
const modules = import.meta.glob<{ concept: ConceptMeta }>('../concepts/*/meta.ts', {
  eager: true,
})

const registry: ConceptMeta[] = Object.values(modules).map((m) => m.concept)

export function listConcepts(): ConceptMeta[] {
  return [...registry].sort((a, b) => a.title.localeCompare(b.title, 'ko'))
}

export function sortByOrder(concepts: ConceptMeta[]): ConceptMeta[] {
  return [...concepts].sort((a, b) => a.order - b.order)
}

export function getAdjacentConcepts(slug: string): {
  prev: ConceptMeta | null
  next: ConceptMeta | null
  position: number
  total: number
} {
  const sorted = sortByOrder(registry)
  const index = sorted.findIndex((c) => c.slug === slug)
  if (index === -1) throw new Error(`개념을 찾을 수 없습니다: ${slug}`)
  return {
    prev: sorted[index - 1] ?? null,
    next: sorted[index + 1] ?? null,
    position: index + 1,
    total: sorted.length,
  }
}

export function getConcept(slug: string): ConceptMeta {
  const found = registry.find((c) => c.slug === slug)
  if (!found) throw new Error(`개념을 찾을 수 없습니다: ${slug}`)
  return found
}

export function filterConcepts(concepts: ConceptMeta[], query: string): ConceptMeta[] {
  const q = query.trim().toLowerCase()
  if (!q) return concepts
  return concepts.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)),
  )
}

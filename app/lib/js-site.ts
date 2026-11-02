// 자매 사이트 JS Under the Hood 링크용 상수. scripts/sync-js-index.mjs가 JS_SITE_URL을 정규식으로 읽는다.
export const JS_SITE_NAME = 'JS Under the Hood'
export const JS_SITE_URL = 'https://js-under-the-hood-kappa.vercel.app'

export function jsConceptUrl(slug: string, anchor?: string): string {
  return `${JS_SITE_URL}/concepts/${slug}${anchor ? `#${anchor}` : ''}`
}

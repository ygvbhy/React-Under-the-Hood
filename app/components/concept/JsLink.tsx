import type { ReactNode } from 'react'
import { JS_SITE_NAME, jsConceptUrl } from '~/lib/js-site'

// MDX에서 import 없이 쓰는 JS Under the Hood 링크. slug·anchor는 content-integrity 테스트가 인덱스로 검사한다.
export function JsLink({
  slug,
  anchor,
  children,
}: {
  slug: string
  anchor?: string
  children: ReactNode
}) {
  return (
    <a
      href={jsConceptUrl(slug, anchor)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-4"
    >
      {children}
      <span className="sr-only"> ({JS_SITE_NAME}, 새 창)</span>
    </a>
  )
}

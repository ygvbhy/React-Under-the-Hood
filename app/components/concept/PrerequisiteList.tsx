import { Link } from 'react-router'
import type { ConceptMeta } from '~/lib/concepts'
import { JS_SITE_NAME, jsConceptUrl } from '~/lib/js-site'

const chip = 'border-border bg-surface inline-block rounded-md border px-2.5 py-0.5 text-sm'

export function PrerequisiteList({
  prerequisites,
  jsPrerequisites,
}: {
  prerequisites: ConceptMeta['prerequisites']
  jsPrerequisites: ConceptMeta['jsPrerequisites']
}) {
  if (prerequisites.length === 0 && jsPrerequisites.length === 0) return null
  return (
    <section aria-labelledby="concept-prerequisites">
      <h2 id="concept-prerequisites" className="mt-10 mb-3 text-xl font-bold">
        선행 개념
      </h2>
      <ul className="flex flex-wrap gap-2">
        {prerequisites.map((p) => (
          <li key={p.label}>
            {p.slug ? (
              <Link
                to={`/concepts/${p.slug}`}
                className={`${chip} text-accent underline underline-offset-4`}
              >
                {p.label}
              </Link>
            ) : (
              <span className={`${chip} text-muted`}>
                {p.label}
                <span className="sr-only"> (준비 중)</span>
              </span>
            )}
          </li>
        ))}
        {jsPrerequisites.map((p) => (
          <li key={`js:${p.slug}:${p.anchor ?? ''}`}>
            <a
              href={jsConceptUrl(p.slug, p.anchor)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${chip} text-accent underline underline-offset-4`}
            >
              {p.label}
              <span className="sr-only"> ({JS_SITE_NAME}, 새 창)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

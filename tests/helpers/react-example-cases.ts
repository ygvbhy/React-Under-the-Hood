import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fixtureCases } from '../fixtures/react-examples/cases'
import type { ConceptMeta } from '~/lib/concepts'

export type ReactExampleCase = {
  name: string
  absPath: string
  interactions: { type: 'click'; selector: string }[]
  expectedOutput: string[]
  errors?: 'expect-violation'
}

// Vitest와 Playwright 스펙이 함께 쓴다. import.meta.glob 대신 readdirSync + 동적 import를 쓴다.
export async function collectReactExampleCases(): Promise<ReactExampleCase[]> {
  const root = process.cwd()
  const cases: ReactExampleCase[] = fixtureCases.map((c) => ({
    name: c.name,
    absPath: join(root, 'tests', 'fixtures', 'react-examples', c.file),
    interactions: c.interactions,
    expectedOutput: c.expectedOutput,
    errors: c.errors,
  }))

  const conceptsDir = join(root, 'app', 'concepts')
  if (!existsSync(conceptsDir)) return cases
  for (const slug of readdirSync(conceptsDir).sort()) {
    const dir = join(conceptsDir, slug)
    const metaPath = join(dir, 'meta.ts')
    if (!statSync(dir).isDirectory() || !existsSync(metaPath)) continue
    const { concept } = (await import(/* @vite-ignore */ pathToFileURL(metaPath).href)) as {
      concept: ConceptMeta
    }
    for (const example of concept.examples) {
      cases.push({
        name: `${slug}/${example.id}`,
        absPath: join(dir, 'examples', example.file),
        interactions: example.interactions ?? [],
        expectedOutput: example.expectedOutput,
      })
    }
  }
  return cases
}

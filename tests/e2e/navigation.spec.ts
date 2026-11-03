import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { collectConsoleErrors, loadConceptsByOrder, waitForHydration } from './helpers'

// app/lib/site.ts는 import.meta.env를 써서 Playwright(Node)에서 import할 수 없으므로 소스에서 상수만 읽는다
const SITE_NAME = /export const SITE_NAME = '([^']+)'/.exec(
  readFileSync(join(process.cwd(), 'app', 'lib', 'site.ts'), 'utf8'),
)![1]

// 개념 수·순서·제목은 meta.ts에서 계산한다(개념을 추가해도 이 파일을 고치지 않는다).
// 검색 기준은 app/lib/concepts.ts의 filterConcepts와 같다(제목·요약·태그, 대소문자 무시).
const QUERY = '객체'
const matchesQuery = (c: { title: string; summary: string; tags: string[] }) =>
  [c.title, c.summary, ...c.tags].some((t) => t.toLowerCase().includes(QUERY))

test.describe('내비게이션', () => {
  test('홈 → 검색 → 카드 클릭 → 개념 페이지', async ({ page }) => {
    const concepts = await loadConceptsByOrder()
    const matched = concepts.filter(matchesQuery)
    test.skip(matched.length === 0, `‘${QUERY}’에 맞는 개념이 없다`)
    const errors = collectConsoleErrors(page)
    await page.goto('/')
    await waitForHydration(page)

    const cards = page.getByRole('article')
    await expect(cards.first()).toBeVisible()

    const search = page.getByRole('searchbox', { name: '개념 검색' })
    await search.fill(QUERY)
    await expect(page).toHaveURL(/\?q=/)
    expect(new URL(page.url()).searchParams.get('q')).toBe(QUERY)
    await expect(cards).toHaveCount(matched.length)
    await expect(cards.first()).toContainText(matched[0].title)

    await cards.first().getByRole('link').click()
    await expect(page).toHaveURL(new RegExp(`/concepts/${matched[0].slug}$`))
    await expect(page.getByRole('heading', { level: 1 })).toContainText(matched[0].title)
    expect(errors.messages).toEqual([])
  })

  test('/?q=객체 직접 진입 시 입력값과 결과가 유지되고 콘솔 에러가 없다', async ({ page }) => {
    const matched = (await loadConceptsByOrder()).filter(matchesQuery)
    const errors = collectConsoleErrors(page)
    await page.goto('/?q=' + encodeURIComponent(QUERY))
    await waitForHydration(page)

    await expect(page.getByRole('searchbox', { name: '개념 검색' })).toHaveValue(QUERY)
    await expect(page.getByRole('article')).toHaveCount(matched.length)
    expect(errors.messages).toEqual([])
  })

  test('/?q=zzz 는 결과 없음 문구를 보여 준다', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/?q=zzz')
    await waitForHydration(page)

    await expect(page.getByText('‘zzz’에 맞는 개념이 없습니다.')).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(0)
    expect(errors.messages).toEqual([])
  })

  test('없는 주소는 404 상태와 404 페이지를 보여 주고 홈으로 돌아갈 수 있다', async ({ page }) => {
    const errors = collectConsoleErrors(page, { ignore404Resource: true })
    const response = await page.goto('/does-not-exist')
    expect(response?.status()).toBe(404)
    await waitForHydration(page)

    await expect(
      page.getByRole('heading', { level: 1, name: '페이지를 찾을 수 없습니다' }),
    ).toBeVisible()
    await page.getByRole('link', { name: '홈으로 돌아가기' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1, name: SITE_NAME })).toBeVisible()
    expect(errors.messages).toEqual([])
  })

  test('홈: 학습 순서 보기로 전환하면 URL과 카드 순서가 바뀌고 검색·뒤로 가기와 함께 유지된다', async ({
    page,
  }, testInfo) => {
    const concepts = await loadConceptsByOrder()
    const matched = concepts.filter(matchesQuery)
    const errors = collectConsoleErrors(page)
    await page.goto('/')
    await waitForHydration(page)

    const group = page.getByRole('group', { name: '보기 방식' })
    await expect(group.getByRole('button', { name: '분류별' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await group.getByRole('button', { name: '학습 순서' }).click()
    await expect(page).toHaveURL(/\?view=order$/)
    await expect(page.getByRole('heading', { level: 3, name: '학습 순서' })).toBeVisible()

    const cards = page.getByRole('article')
    await expect(cards).toHaveCount(concepts.length)
    // 순위(span)와 제목(링크)은 별개 요소이므로 따로 확인한다
    const firstHeading = cards.first().getByRole('heading', { level: 4 })
    await expect(firstHeading).toContainText('1번째')
    await expect(firstHeading.getByRole('link')).toHaveText(concepts[0].title)
    const lastHeading = cards.last().getByRole('heading', { level: 4 })
    await expect(lastHeading).toContainText(`${concepts.length}번째`)
    await expect(lastHeading.getByRole('link')).toHaveText(concepts.at(-1)!.title)

    // 검색과 병행: 걸러져도 전체 학습 순서의 순위가 유지된다
    await page.getByRole('searchbox', { name: '개념 검색' }).fill(QUERY)
    await expect(cards).toHaveCount(matched.length)
    const url = new URL(page.url())
    expect(url.searchParams.get('view')).toBe('order')
    expect(url.searchParams.get('q')).toBe(QUERY)
    if (concepts.length >= 2) {
      const ranks = await cards
        .getByRole('heading', { level: 4 })
        .evaluateAll((els) => els.map((el) => /^(\d+)번째/.exec(el.textContent ?? '')?.[1]))
      expect(ranks).toEqual(concepts.flatMap((c, i) => (matchesQuery(c) ? [String(i + 1)] : [])))
    } else {
      testInfo.annotations.push({ type: 'note', description: '개념 1개: 순위 유지 단언 생략' })
    }

    // 카드 → 개념 페이지 → 뒤로 가기: 보기와 검색어가 유지된다
    if (matched.length > 0) {
      await cards.first().getByRole('link').click()
      await expect(page).toHaveURL(new RegExp(`/concepts/${matched[0].slug}$`))
      await page.goBack()
      await waitForHydration(page)
      await expect(page.getByRole('searchbox', { name: '개념 검색' })).toHaveValue(QUERY)
      await expect(
        page.getByRole('group', { name: '보기 방식' }).getByRole('button', { name: '학습 순서' }),
      ).toHaveAttribute('aria-pressed', 'true')
      await expect(cards).toHaveCount(matched.length)
    }
    expect(errors.messages).toEqual([])
  })

  test('/?view=order 직접 진입 시 학습 순서 보기이고 콘솔 에러가 없다', async ({ page }) => {
    const concepts = await loadConceptsByOrder()
    const errors = collectConsoleErrors(page)
    await page.goto('/?view=order')
    await waitForHydration(page)

    await expect(
      page.getByRole('group', { name: '보기 방식' }).getByRole('button', { name: '학습 순서' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { level: 3, name: '학습 순서' })).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(concepts.length)
    expect(errors.messages).toEqual([])
  })

  test('학습 순서 보기에서 결과가 없으면 학습 순서 목록을 그리지 않는다', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/?view=order&q=zzz')
    await waitForHydration(page)

    await expect(
      page.getByRole('group', { name: '보기 방식' }).getByRole('button', { name: '학습 순서' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('‘zzz’에 맞는 개념이 없습니다.')).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: '학습 순서' })).toHaveCount(0)
    await expect(page.getByRole('main').locator('ol')).toHaveCount(0)
    expect(errors.messages).toEqual([])
  })

  test('개념 페이지 하단: 처음·마지막 개념은 한쪽 링크만 있고 다음 링크로 이동한다', async ({
    page,
  }) => {
    const concepts = await loadConceptsByOrder()
    const total = concepts.length
    const errors = collectConsoleErrors(page)

    // 첫 개념: 이전 개념 링크가 없다
    await page.goto(`/concepts/${concepts[0].slug}`)
    await waitForHydration(page)
    let pager = page.getByRole('navigation', { name: '학습 순서' })
    await expect(pager).toContainText(`학습 순서 1 / ${total}`)
    await expect(pager.getByRole('link', { name: /이전 개념/ })).toHaveCount(0)
    if (total >= 2) {
      await expect(pager.getByRole('link', { name: /다음 개념/ })).toHaveAttribute(
        'href',
        `/concepts/${concepts[1].slug}`,
      )
    } else {
      await expect(pager.getByRole('link')).toHaveCount(0)
    }

    // 마지막 개념: 다음 개념 링크가 없다
    await page.goto(`/concepts/${concepts.at(-1)!.slug}`)
    await waitForHydration(page)
    pager = page.getByRole('navigation', { name: '학습 순서' })
    await expect(pager).toContainText(`학습 순서 ${total} / ${total}`)
    await expect(pager.getByRole('link', { name: /다음 개념/ })).toHaveCount(0)
    if (total >= 2) {
      await expect(pager.getByRole('link', { name: /이전 개념/ })).toHaveAttribute(
        'href',
        `/concepts/${concepts.at(-2)!.slug}`,
      )
    }

    // 개념이 2개 이상이면 첫 개념에서 다음 링크를 눌러 2번째 개념으로 이동한다
    if (total >= 2) {
      await page.goto(`/concepts/${concepts[0].slug}`)
      await waitForHydration(page)
      await page
        .getByRole('navigation', { name: '학습 순서' })
        .getByRole('link', { name: /다음 개념/ })
        .click()
      await expect(page).toHaveURL(new RegExp(`/concepts/${concepts[1].slug}$`))
      await expect(page.getByRole('navigation', { name: '학습 순서' })).toContainText(
        `학습 순서 2 / ${total}`,
      )
    }
    expect(errors.messages).toEqual([])
  })
})

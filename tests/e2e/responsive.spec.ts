import { expect, test } from '@playwright/test'
import { CONCEPT_PATH, SIMULATOR_NAME, loadConceptsByOrder, waitForHydration } from './helpers'

// 두 프로젝트(desktop 1280px, mobile 375px)에서 모두 가로 스크롤이 생기지 않아야 한다.
for (const path of ['/', '/about', CONCEPT_PATH, '/404']) {
  test(`${path}: 가로 스크롤이 없다`, async ({ page }) => {
    await page.goto(path)
    await waitForHydration(page)
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth)
  })
}

test('개념 페이지: 시뮬레이터를 끝까지 진행해도 가로 스크롤이 없다', async ({ page }) => {
  await page.goto(CONCEPT_PATH)
  await waitForHydration(page)
  const region = page.getByRole('region', { name: SIMULATOR_NAME })
  for (const scenario of ['JSX와 createElement', '중첩된 JSX']) {
    await region.getByRole('radio', { name: scenario }).check()
    const next = region.getByRole('button', { name: '다음' })
    // 마지막 단계에서 next는 aria-disabled가 되므로 단계 수(7)만큼 진행한다
    for (let i = 0; i < 6; i++) {
      await next.click()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    }
  }
})

test(`${CONCEPT_PATH}: 하단 학습 순서 내비게이션이 있어도 가로 스크롤이 없다`, async ({ page }) => {
  await page.goto(CONCEPT_PATH)
  await waitForHydration(page)
  const pager = page.getByRole('navigation', { name: '학습 순서' })
  await pager.scrollIntoViewIfNeeded()
  await expect(pager).toBeVisible()
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth)
})

test('홈 학습 순서 보기: 가로 스크롤이 없다', async ({ page }) => {
  const concepts = await loadConceptsByOrder()
  await page.goto('/?view=order')
  await waitForHydration(page)
  await expect(page.getByRole('article')).toHaveCount(concepts.length)
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth)
})

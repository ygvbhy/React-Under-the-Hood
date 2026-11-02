import { expect, test } from '@playwright/test'
import { waitForHydration } from './helpers'

// 두 프로젝트(desktop 1280px, mobile 375px)에서 모두 가로 스크롤이 생기지 않아야 한다.
for (const path of ['/', '/about', '/404']) {
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

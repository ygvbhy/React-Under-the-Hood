import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { waitForHydration } from './helpers'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// critical·serious 위반만 실패로 본다. 위반 내용은 실패 메시지에 요약해 보여 준다.
async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  const summary = serious.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      summary: n.failureSummary,
    })),
  }))
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([])
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`axe (${colorScheme})`, () => {
    test.use({ colorScheme })

    test('홈', async ({ page }) => {
      await page.goto('/')
      await waitForHydration(page)
      await expectNoSeriousViolations(page)
    })

    test('홈: 검색 결과 / 결과 없음', async ({ page }) => {
      await page.goto('/?q=' + encodeURIComponent('객체'))
      await waitForHydration(page)
      await expectNoSeriousViolations(page)
      await page.goto('/?q=zzz')
      await waitForHydration(page)
      await expectNoSeriousViolations(page)
    })
  })
}

test.describe('홈: 보기 방식 키보드 조작', () => {
  for (const key of ['Space', 'Enter']) {
    test(`Tab으로 버튼에 도달해 ${key} 키로 전환한다`, async ({ page }) => {
      await page.goto('/')
      await waitForHydration(page)
      const group = page.getByRole('group', { name: '보기 방식' })
      const category = group.getByRole('button', { name: '분류별' })
      const order = group.getByRole('button', { name: '학습 순서' })

      await page.getByRole('searchbox', { name: '개념 검색' }).focus()
      await page.keyboard.press('Tab')
      await expect(category).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(order).toBeFocused()
      await expect(order).toHaveAttribute('aria-pressed', 'false')

      await page.keyboard.press(key)
      await expect(order).toHaveAttribute('aria-pressed', 'true')
      await expect(category).toHaveAttribute('aria-pressed', 'false')
      await expect(page).toHaveURL(/\?view=order$/)

      await page.keyboard.press('Shift+Tab')
      await expect(category).toBeFocused()
      await page.keyboard.press(key)
      await expect(category).toHaveAttribute('aria-pressed', 'true')
      await expect(order).toHaveAttribute('aria-pressed', 'false')
      expect(new URL(page.url()).searchParams.has('view')).toBe(false)
    })
  }
})

test.describe('axe (기본 색상 모드)', () => {
  test('소개', async ({ page }) => {
    await page.goto('/about')
    await waitForHydration(page)
    await expectNoSeriousViolations(page)
  })

  test('404', async ({ page }) => {
    await page.goto('/does-not-exist')
    await waitForHydration(page)
    await expectNoSeriousViolations(page)
  })
})

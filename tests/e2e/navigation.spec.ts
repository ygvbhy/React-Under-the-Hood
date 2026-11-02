import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { collectConsoleErrors, waitForHydration } from './helpers'

// app/lib/site.ts는 import.meta.env를 써서 Playwright(Node)에서 import할 수 없으므로 소스에서 상수만 읽는다
const SITE_NAME = /export const SITE_NAME = '([^']+)'/.exec(
  readFileSync(join(process.cwd(), 'app', 'lib', 'site.ts'), 'utf8'),
)![1]

test.describe('내비게이션', () => {
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
})

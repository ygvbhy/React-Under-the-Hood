import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import {
  CONCEPT_PATH,
  PURE_STRICT_PATH,
  PURE_STRICT_SIMULATOR_NAME,
  RENDER_COMMIT_PATH,
  RENDER_COMMIT_SIMULATOR_NAME,
  SIMULATOR_NAME,
  waitForHydration,
} from './helpers'

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

    test('홈: 학습 순서 보기', async ({ page }) => {
      await page.goto('/?view=order')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { level: 3, name: '학습 순서' })).toBeVisible()
      await expectNoSeriousViolations(page)
    })

    test('개념 페이지', async ({ page }) => {
      await page.goto(CONCEPT_PATH)
      await waitForHydration(page)
      await expect(page.getByRole('button', { name: '정답 확인' }).first()).toBeVisible()
      await expectNoSeriousViolations(page)
    })

    test('개념 페이지: 시뮬레이터를 진행한 뒤', async ({ page }) => {
      test.slow() // 두 시나리오의 모든 단계에서 axe를 돌리므로 기본 30초에 가깝다
      await page.goto(CONCEPT_PATH)
      await waitForHydration(page)
      const region = page.getByRole('region', { name: SIMULATOR_NAME })
      for (const scenario of ['JSX와 createElement', '중첩된 JSX']) {
        await region.getByRole('radio', { name: scenario }).check()
        const next = region.getByRole('button', { name: '다음' })
        // 중첩 element 카드, 호출 기록, #root 표시 등 단계마다 달라지는 표시를 모두 검사한다.
        // 두 시나리오 모두 7단계다. 마지막 단계에서는 다음이 aria-disabled가 된다.
        for (let i = 0; i < 6; i++) {
          await next.click()
          await expectNoSeriousViolations(page)
        }
        await expect(next).toHaveAttribute('aria-disabled', 'true')
      }
    })

    test('render-and-commit: 시뮬레이터를 진행한 뒤', async ({ page }) => {
      test.slow() // 두 시나리오의 모든 단계에서 axe를 돌린다
      await page.goto(RENDER_COMMIT_PATH)
      await waitForHydration(page)
      const region = page.getByRole('region', { name: RENDER_COMMIT_SIMULATOR_NAME })
      const scenarios: [string, number][] = [
        ['state 업데이트', 10],
        ['DOM 변경 없는 다시 렌더', 11],
      ]
      for (const [scenario, steps] of scenarios) {
        await region.getByRole('radio', { name: scenario }).check()
        const next = region.getByRole('button', { name: '다음' })
        // 마지막 단계에서는 다음이 aria-disabled가 되므로 단계 수 - 1번 누른다
        for (let i = 0; i < steps - 1; i++) {
          await next.click()
          await expectNoSeriousViolations(page)
        }
        await expect(next).toHaveAttribute('aria-disabled', 'true')
      }
    })

    test('pure-and-strict-mode: 시뮬레이터를 진행한 뒤', async ({ page }) => {
      test.slow() // 두 시나리오의 모든 단계에서 axe를 돌린다
      await page.goto(PURE_STRICT_PATH)
      await waitForHydration(page)
      const region = page.getByRole('region', { name: PURE_STRICT_SIMULATOR_NAME })
      const scenarios: [string, number][] = [
        ['바깥 변수를 바꾸는 Ticket', 10],
        ['props만 쓰는 Ticket', 10],
      ]
      for (const [scenario, steps] of scenarios) {
        await region.getByRole('radio', { name: scenario }).check()
        const next = region.getByRole('button', { name: '다음' })
        // 마지막 단계에서는 다음이 aria-disabled가 되므로 단계 수 - 1번 누른다
        for (let i = 0; i < steps - 1; i++) {
          await next.click()
          await expectNoSeriousViolations(page)
        }
        await expect(next).toHaveAttribute('aria-disabled', 'true')
      }
    })

    test('개념 페이지: 퀴즈 정답을 공개한 뒤', async ({ page }) => {
      await page.goto(CONCEPT_PATH)
      await waitForHydration(page)
      const quiz = page.getByRole('group', { name: /예제 1의 출력/ })
      await quiz.getByRole('radio').nth(1).check() // 오답 표시(✗)까지 검사
      await quiz.locator('..').getByRole('button', { name: '정답 확인' }).click()
      await expect(page.getByText('오답입니다. 정답은 1번입니다.')).toBeVisible()
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

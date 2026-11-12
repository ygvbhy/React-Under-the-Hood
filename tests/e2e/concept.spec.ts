import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONCEPT_PATH, SIMULATOR_NAME, collectConsoleErrors, waitForHydration } from './helpers'

const simulator = (page: Page) => page.getByRole('region', { name: SIMULATOR_NAME })
const liveRegion = (region: Locator) => region.getByRole('status')
const currentLine = (region: Locator) => region.locator('[aria-current="step"]')
const area = (region: Locator, name: string) => region.getByRole('region', { name, exact: true })

// 시뮬레이터가 보여 주는 예제 1의 줄 텍스트는 파일에서 읽어 와 줄 번호로 대조한다
const exampleLines = readFileSync(
  join(process.cwd(), 'app', 'concepts', 'jsx-to-element', 'examples', 'element-object.jsx'),
  'utf8',
).split('\n')
const lineText = (n: number) => exampleLines[n - 1].trim()

async function openConcept(page: Page) {
  const errors = collectConsoleErrors(page)
  await page.goto(CONCEPT_PATH)
  await waitForHydration(page)
  // 퀴즈는 하이드레이션 이후에 라디오 UI로 바뀐다
  await expect(page.getByRole('button', { name: '정답 확인' }).first()).toBeVisible()
  return errors
}

test.describe('개념 상세', () => {
  test('헤더·검토일 배지·학습 목표·선행 개념 링크를 보여 준다', async ({ page }) => {
    const errors = await openConcept(page)

    await expect(
      page.getByRole('heading', { level: 1, name: 'JSX는 함수 호출이다: element는 그냥 객체' }),
    ).toBeVisible()
    // reviewedAt을 기록했으므로 '검토 중' 대신 검토일 배지를 보여 준다
    await expect(page.locator('article > header').getByText(/^검토일/)).toHaveText(
      '검토일 2026-11-12',
    )
    await expect(page.getByRole('heading', { level: 2, name: '학습 목표' })).toBeVisible()

    const prerequisites = page.getByRole('region', { name: '선행 개념' })
    await expect(prerequisites).toBeVisible()
    for (const label of ['함수 호출', '원시 값과 객체']) {
      // JS 사이트 개념은 새 창으로 여는 외부 링크다
      const link = prerequisites.getByRole('link', { name: label })
      await expect(link).toHaveCount(1)
      await expect(link).toHaveAttribute('target', '_blank')
    }
    expect(errors.messages).toEqual([])
  })

  test('예측 퀴즈: 선택 전 확인 불가 → 선택 → 정답·이유 → 다시 풀기 → 오답 안내', async ({
    page,
  }) => {
    const errors = await openConcept(page)

    const quiz = page.getByRole('group', { name: /예제 1의 출력/ })
    const box = quiz.locator('..')
    const check = box.getByRole('button', { name: '정답 확인' })
    await expect(check).toBeDisabled()

    await quiz.getByRole('radio').nth(0).check()
    await expect(check).toBeEnabled()
    await check.click()

    await expect(box.getByText('정답입니다.')).toBeVisible()
    await expect(box.getByText('✓ 정답')).toBeVisible()
    await expect(box.getByText(/fromCall은 렌더하지 않았으므로 호출되지 않습니다/)).toBeVisible()

    await box.getByRole('button', { name: '다시 풀기' }).click()
    await expect(box.getByText('정답입니다.')).toHaveCount(0)
    await expect(box.getByRole('button', { name: '정답 확인' })).toBeDisabled()
    await expect(quiz.getByRole('radio', { checked: true })).toHaveCount(0)

    // 오답을 고르면 정답 번호와 오답 표시를 함께 보여 준다
    await quiz.getByRole('radio').nth(1).check()
    await box.getByRole('button', { name: '정답 확인' }).click()
    await expect(box.getByText('오답입니다. 정답은 1번입니다.')).toBeVisible()
    await expect(box.getByText('✗ 선택한 답 (오답)')).toBeVisible()
    expect(errors.messages).toEqual([])
  })

  test('시뮬레이터 "JSX와 createElement": 강조 줄이 따라 움직이고 render 단계에서만 Greeting이 호출된다', async ({
    page,
  }) => {
    const errors = await openConcept(page)
    const region = simulator(page)
    await expect(region.getByRole('radio', { name: 'JSX와 createElement' })).toBeChecked()

    await expect(region.getByText('단계 1 / 7')).toBeVisible()
    await expect(currentLine(region)).toHaveCount(0)
    await expect(area(region, '변수')).toContainText('아직 만든 element가 없습니다.')
    await expect(area(region, '#root')).toContainText('비어 있음')

    const next = region.getByRole('button', { name: '다음' })
    const calls = area(region, '컴포넌트 호출 기록')
    // 단계 2~7의 강조 줄(from~to)
    const highlighted = [[9], [10], [12], [13, 14], [15], [17]]
    for (const [i, lines] of highlighted.entries()) {
      await next.click()
      await expect(region.getByText(`단계 ${i + 2} / 7`)).toBeVisible()
      await expect(currentLine(region)).toHaveCount(lines.length)
      for (const [j, n] of lines.entries()) {
        await expect(currentLine(region).nth(j)).toContainText(String(n))
        await expect(currentLine(region).nth(j)).toContainText(lineText(n))
      }
      if (i + 2 < 7) await expect(calls).toContainText('아직 호출되지 않음')
    }

    await expect(region.getByText('단계 7 / 7')).toBeVisible()
    await expect(calls.getByText('Greeting({ name: "민지" })', { exact: true })).toBeVisible()
    await expect(area(region, '#root')).not.toContainText('비어 있음')
    await expect(
      area(region, '콘솔 출력').getByText('Greeting 호출: 민지', { exact: true }),
    ).toBeVisible()
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(next).toBeFocused()

    await region.getByRole('button', { name: '처음으로' }).click()
    await expect(region.getByText('단계 1 / 7')).toBeVisible()
    await expect(liveRegion(region)).toContainText('단계 1:')
    await expect(currentLine(region)).toHaveCount(0)
    await expect(calls).toContainText('아직 호출되지 않음')
    expect(errors.messages).toEqual([])
  })

  test('시뮬레이터 "중첩된 JSX": 끝까지 진행하면 마지막 출력은 string이다', async ({ page }) => {
    const errors = await openConcept(page)
    const region = simulator(page)
    await region.getByRole('radio', { name: '중첩된 JSX' }).check()

    await expect(region.getByText('단계 1 / 7')).toBeVisible()
    await expect(currentLine(region)).toHaveCount(0)

    const next = region.getByRole('button', { name: '다음' })
    for (let i = 0; i < 6; i++) await next.click()
    await expect(region.getByText('단계 7 / 7')).toBeVisible()
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    const output = area(region, '콘솔 출력')
    await expect(output.getByText('string', { exact: true })).toBeVisible()
    await expect(output.getByText('section card', { exact: true })).toBeVisible()
    expect(errors.messages).toEqual([])
  })

  test('키보드: 영역에 포커스 후 ←/→/Home으로 이동하고 live region이 갱신된다', async ({
    page,
  }) => {
    const errors = await openConcept(page)
    const region = simulator(page)
    const live = liveRegion(region)

    // 키보드만으로 도달: 바로 앞 제목의 앵커 링크에서 Tab 한 번으로 시뮬레이터 영역에 포커스가 간다
    await page.getByRole('heading', { name: '시뮬레이터로 확인하기' }).getByRole('link').focus()
    await page.keyboard.press('Tab')
    await expect(region).toBeFocused()

    // 안내(sr-only status)는 처음에는 비어 있고, 사용자 조작 뒤부터 현재 단계를 담는다
    await expect(live).toHaveText('')
    await expect(live).toHaveAttribute('aria-live', 'polite')
    await page.keyboard.press('ArrowRight')
    await expect(live).toContainText('단계 2:')
    await expect(region.getByText('단계 2 / 7')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(live).toContainText('단계 3:')
    await page.keyboard.press('ArrowLeft')
    await expect(live).toContainText('단계 2:')
    await page.keyboard.press('Home')
    await expect(live).toContainText('단계 1:')

    // 단계 컨트롤 버튼에 포커스가 있어도 같은 키가 동작한다
    await region.getByRole('button', { name: '다음' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(live).toContainText('단계 2:')

    // 자동 재생 중에는 안내가 고정되고, 멈추면 현재 단계가 안내된다
    await region.getByRole('button', { name: '자동 재생' }).click()
    await expect(region.getByText(/단계 [4-7] \/ 7/)).toBeVisible() // 재생이 진행된다
    await expect(live).toContainText('단계 2:')
    await region.getByRole('button', { name: '일시정지' }).click()
    const current = await region.getByText(/^단계 \d \/ 7$/).textContent()
    const n = current!.match(/단계 (\d)/)![1]
    await expect(live).toContainText(`단계 ${n}:`)
    expect(errors.messages).toEqual([])
  })

  test('시뮬레이터 컨트롤은 모바일 뷰포트에서도 조작할 수 있다', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', '모바일 프로젝트 전용')
    const errors = await openConcept(page)
    const region = simulator(page)
    await region.getByRole('button', { name: '다음' }).tap()
    await expect(region.getByText('단계 2 / 7')).toBeVisible()
    await region.getByRole('button', { name: '처음으로' }).tap()
    await expect(region.getByText('단계 1 / 7')).toBeVisible()
    expect(errors.messages).toEqual([])
  })
})

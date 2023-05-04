import { test } from '../pwTest'
import { expect } from '@playwright/test'

test.describe('Status check', () => {
  test('should return correct status info', async ({ page }) => {
    await page.goto('/fpjs/status', {
      waitUntil: 'networkidle',
    })

    await expect(page.waitForSelector('text="✅ All environment variables are set"')).resolves.not.toThrow()
  })
})

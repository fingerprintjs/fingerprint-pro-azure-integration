import { test } from '../pwTest.ts'
import { expect } from '@playwright/test'
import { STATUS_PATH } from '../../../shared/status.ts'

test.describe('Status check', () => {
  test('should return correct status info', async ({ page, azureTestInfo }) => {
    await page.goto(`/${azureTestInfo.routePrefix}/${STATUS_PATH}`, {
      waitUntil: 'networkidle',
    })

    await expect(page.waitForSelector('text="✅ All environment variables are set"')).resolves.not.toThrow()
  })
})

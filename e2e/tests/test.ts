import { test as baseTest } from '@playwright/test'
import { readTestInfo, TestInfo } from '../shared/testInfo'

// For future, in case if we need to extend the base test
export const test = baseTest.extend<{ azureTestInfo: TestInfo }>({
  azureTestInfo: async (_, use) => {
    const testInfo = readTestInfo()
    await use(testInfo)
  },
})

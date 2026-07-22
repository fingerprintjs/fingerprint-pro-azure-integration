import { test as baseTest } from '@playwright/test'
import { readTestInfo, TestInfo } from '../shared/testInfo.ts'
import { assertIsTruthy } from '../../shared/assert.ts'

// For future, in case if we need to extend the base test
export const test = baseTest.extend<{ azureTestInfo: TestInfo }>({
  azureTestInfo: async ({ baseURL }, use) => {
    const testInfo = readTestInfo()
    const project = testInfo.tests.find((info) => info.frontdoorUrl === baseURL)

    assertIsTruthy(project, 'project is required')

    console.info(`Using ${project.frontdoorUrl} for tests`)

    await use(project)
  },
})

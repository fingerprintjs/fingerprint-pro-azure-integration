import { test as baseTest } from '@playwright/test'
import { readTestInfo, TestInfo } from '../shared/testInfo'
import invariant from 'tiny-invariant'

// For future, in case if we need to extend the base test
export const test = baseTest.extend<{ azureTestInfo: TestInfo }>({
  azureTestInfo: async ({ baseURL }, use) => {
    const testInfo = readTestInfo()
    const project = testInfo.find((info) => info.frontdoorUrl === baseURL)

    invariant(project, 'project is required')

    console.info(`Using ${project.frontdoorUrl} for tests`)

    await use(project)
  },
})

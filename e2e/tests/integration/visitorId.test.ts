import { expect, Page } from '@playwright/test'
import { isRequestIdValid } from '../utils/areVisitorIdAndRequestIdValid'
import { test } from '../pwTest'
import { trackRequests } from '../utils/playwright'

async function checkResponse(page: Page) {
  const response = await page.waitForSelector('#response pre').then((element) => element.textContent())

  expect(response).toBeTruthy()

  const json = JSON.parse(response as string)

  expect(isRequestIdValid(json.requestId)).toBeTruthy()
}

test.describe('visitorId', () => {
  interface TestCase {
    queryParams?: Record<string, string>
  }

  const testCases: TestCase[] = [
    {
      queryParams: undefined,
    },
    {
      queryParams: {
        // Script pattern without version
        scriptUrlPattern: '/fpjs/agent?apiKey=<apiKey>&loaderVersion=<loaderVersion>',
      },
    },
  ]

  testCases.forEach((testCase, index) => {
    test(`should show correct visitorId using function endpoints #${index + 1}`, async ({ page, baseURL }) => {
      if (testCase.queryParams) {
        const queryParams = new URLSearchParams(testCase.queryParams)
        await page.goto(`/?${queryParams.toString()}`, {
          waitUntil: 'networkidle',
        })
      }

      const rootUrl = new URL(baseURL as string)

      const { getRequests } = trackRequests(page)

      await page.goto('/', {
        waitUntil: 'networkidle',
      })

      await page.click('#getData')

      await checkResponse(page)

      const requests = getRequests()
      expect(requests).toHaveLength(6)

      const [, , , agentRequest, , apiRequest] = requests

      const agentRequestUrl = new URL(agentRequest.url())
      expect(agentRequestUrl.hostname).toBe(rootUrl.hostname)

      const apiRequestUrl = new URL(apiRequest.url())
      expect(apiRequestUrl.hostname).toBe(rootUrl.hostname)
      expect(apiRequestUrl.searchParams.get('ci')).toContain(`js/`)
    })
  })
})

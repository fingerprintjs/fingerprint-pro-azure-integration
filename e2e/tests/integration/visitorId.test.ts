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
  test('should return error when trying to get agent without passing apiKey', async ({ page, azureTestInfo }) => {
    const path = `${azureTestInfo.routePrefix}/${azureTestInfo.agentDownloadPath}`
    await page.goto(`/${path}`, {
      waitUntil: 'networkidle',
    })

    const body = await page.evaluate(() => document.body.innerText)

    const jsonBody = JSON.parse(body ?? '')

    expect(jsonBody).toEqual({
      vendor: 'Fingerprint Pro Azure Function',
      message: 'API Key is missing',
      path,
    })
  })

  test(`should show correct visitorId using function endpoints`, async ({ page, baseURL, azureTestInfo }) => {
    const queryParams = new URLSearchParams({
      scriptUrlPattern: `/${azureTestInfo.routePrefix}/${azureTestInfo.agentDownloadPath}?apiKey=<apiKey>&loaderVersion=<loaderVersion>`,
      endpoint: `/${azureTestInfo.routePrefix}/${azureTestInfo.getResultPath}`,
    })
    await page.goto(`/?${queryParams.toString()}`, {
      waitUntil: 'networkidle',
    })

    const rootUrl = new URL(baseURL as string)

    const { getRequests } = trackRequests(page)

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

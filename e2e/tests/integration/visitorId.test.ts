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

async function checkResponseV4(page: Page) {
  const response = await page.waitForSelector('#response pre').then((element) => element.textContent())

  expect(response).toBeTruthy()

  const json = JSON.parse(response as string)

  expect(isRequestIdValid(json.event_id)).toBeTruthy()
}

test.describe('visitorId', () => {
  test(`should show correct visitorId using function endpoints`, async ({ page, baseURL, azureTestInfo }) => {
    const queryParams = new URLSearchParams({
      version: 'v3',
      integrationPath: azureTestInfo.routePrefix,
      endpoint: azureTestInfo.getResultPath,
      agentPath: azureTestInfo.agentDownloadPath,
    })
    console.debug(queryParams.toString())
    await page.goto(`/?${queryParams.toString()}`, {
      waitUntil: 'networkidle',
    })

    const rootUrl = new URL(baseURL as string)

    const { getRequests } = trackRequests(page)

    await page.click('#getData')

    await checkResponse(page)

    const requests = getRequests()
    expect(requests).toHaveLength(3)

    const [agentRequest, , apiRequest] = requests

    const agentRequestUrl = new URL(agentRequest.url())
    expect(agentRequestUrl.hostname).toBe(rootUrl.hostname)

    const apiRequestUrl = new URL(apiRequest.url())
    expect(apiRequestUrl.hostname).toBe(rootUrl.hostname)
    expect(apiRequestUrl.searchParams.get('ci')).toContain(`js/`)
  })

  test(`should show correct visitorId using function endpoints with Agent V4`, async ({
    page,
    baseURL,
    azureTestInfo,
  }) => {
    const queryParams = new URLSearchParams({
      version: 'v4',
      integrationPath: azureTestInfo.routePrefix,
      endpoint: azureTestInfo.getResultPath,
      agentPath: azureTestInfo.agentDownloadPath,
    })
    await page.goto(`/?${queryParams.toString()}`, {
      waitUntil: 'networkidle',
    })

    const rootUrl = new URL(baseURL as string)

    const { getRequests } = trackRequests(page)

    await page.click('#getData')

    await checkResponseV4(page)

    const requests = getRequests()
    expect(requests).toHaveLength(4)

    const [agentRequest, , , apiRequest] = requests

    const agentRequestUrl = new URL(agentRequest.url())
    expect(agentRequestUrl.hostname).toBe(rootUrl.hostname)

    const apiRequestUrl = new URL(apiRequest.url())
    expect(apiRequestUrl.hostname).toBe(rootUrl.hostname)
    expect(apiRequestUrl.searchParams.get('ci')).toContain(`js/`)
  })
})

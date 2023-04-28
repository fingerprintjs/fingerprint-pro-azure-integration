import { chromium, FullConfig } from '@playwright/test'
import { ExponentialBackoff, handleAll, retry } from 'cockatiel'
import { readTestInfo } from '../shared/testInfo'
import invariant from 'tiny-invariant'

export default async function setup(config: FullConfig) {
  const testInfo = readTestInfo()

  const targets = config.projects.map((p) => ({
    name: p.name,
    url: p.use.baseURL,
    testInfo: testInfo.find((info) => info.frontdoorUrl === p.use.baseURL),
    headless: p.use.headless,
  }))

  for (const target of targets) {
    const browser = await chromium.launch({
      headless: target.headless,
    })

    invariant(target.testInfo, `Test info for ${target.name} not found`)
    invariant(target.url, `URL for ${target.name} not found`)

    const queryParams = new URLSearchParams({
      scriptUrlPattern: `/${target.testInfo.routePrefix}/${target.testInfo.agentDownloadPath}?apiKey=<apiKey>&loaderVersion=<loaderVersion>`,
      endpoint: `/${target.testInfo.routePrefix}/${target.testInfo.getResultPath}`,
    })

    const url = new URL(target.url)
    url.search = queryParams.toString()

    try {
      const page = await browser.newPage()
      await page.goto(url.toString())

      const policy = retry(handleAll, {
        maxAttempts: 30,
        backoff: new ExponentialBackoff({
          maxDelay: 60_000,
          initialDelay: 3000,
        }),
      })

      console.info('Waiting for website...')

      await policy.execute(async ({ attempt }) => {
        if (attempt > 1) {
          console.info('Attempt', attempt)

          await page.reload({
            waitUntil: 'networkidle',
          })
        }

        const info = await page.waitForSelector('.integration-info')

        if ((await info.getAttribute('data-ok')) !== 'true') {
          throw new Error('Integration is not running correctly')
        }
      })
    } finally {
      await browser.close()
    }
  }
}

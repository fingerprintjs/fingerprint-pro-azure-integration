import { chromium, FullConfig } from '@playwright/test'
import { ExponentialBackoff, handleAll, retry } from 'cockatiel'

export default async function setup(config: FullConfig) {
  const { baseURL, headless } = config.projects[0].use
  const browser = await chromium.launch({
    headless,
  })

  try {
    const page = await browser.newPage()
    await page.goto(baseURL!)

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

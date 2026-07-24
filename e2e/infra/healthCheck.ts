import { getSiteUrl, getStatusUrl } from './site'
import { ExponentialBackoff, handleAll, retry, timeout, TimeoutStrategy, wrap } from 'cockatiel'
import { StatusInfo } from '../../shared/status'

export function doHealthCheck(siteName: string, integrationPath: string) {
  const url = getStatusUrl(getSiteUrl(siteName), integrationPath)

  console.info(`Site url: ${url}`)

  const policy = wrap(
    retry(handleAll, {
      backoff: new ExponentialBackoff({
        initialDelay: 500,
      }),
    }),
    timeout(240_000, TimeoutStrategy.Aggressive)
  )

  return policy.execute(async ({ attempt }) => {
    if (attempt > 1) {
      console.info(`Health check attempt ${attempt}`)
    }

    const response = await fetch(url)
    // `Response.json()` is untyped (returns `any`), so we assert the parsed shape here.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const json = (await response.json()) as StatusInfo | undefined

    if (!json) {
      throw new Error(`Health check failed with status ${response.status}`)
    }
  })
}

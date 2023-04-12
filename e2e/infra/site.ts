import { StatusFormat } from '../../shared/status'
import { ExponentialBackoff, handleAll, retry, timeout, TimeoutStrategy, wrap } from 'cockatiel'
import { websiteManagementClient } from './clients'

export function getSiteUrl(siteName: string) {
  return `https://${siteName}.azurewebsites.net`
}

export function getStatusUrl(baseUrl: string) {
  const url = new URL(baseUrl)
  url.pathname = '/fpjs/status'
  url.searchParams.set('format', StatusFormat.JSON)

  return url.toString()
}

export async function getWebApp(resourceGroup: string, appName: string) {
  const policy = wrap(
    timeout(30_000, TimeoutStrategy.Aggressive),
    retry(handleAll, {
      maxAttempts: 10,
      backoff: new ExponentialBackoff(),
    }),
  )

  return policy.execute(async ({ attempt }) => {
    if (attempt > 0) {
      console.info(`Attempt ${attempt}...`)
    }

    const webApps = await websiteManagementClient.webApps.list()

    for await (const webApp of webApps) {
      if (webApp.name?.startsWith(appName) && webApp.resourceGroup === resourceGroup) {
        return webApp
      }
    }

    throw new Error(`App with name ${appName} not found.`)
  })
}

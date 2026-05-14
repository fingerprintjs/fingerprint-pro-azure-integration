import { Site, WebSiteManagementClient } from '@azure/arm-appservice'
import { InvocationContext } from '@azure/functions'

export interface PerformRollbackParams {
  site: Site
  client: WebSiteManagementClient
  resourceGroupName: string
  appName: string
  oldFunctionZipUrl: string
  logger?: InvocationContext
}

export async function performRollback({
  site,
  client,
  resourceGroupName,
  appName,
  oldFunctionZipUrl,
  logger,
}: PerformRollbackParams) {
  logger?.debug(`Rolling back to ${oldFunctionZipUrl}`)

  await client.webApps.beginCreateOrUpdateAndWait(resourceGroupName, appName, {
    ...site,
    functionAppConfig: {
      ...site.functionAppConfig,
      deployment: {
        ...site.functionAppConfig?.deployment,
        storage: {
          ...site.functionAppConfig?.deployment?.storage,
          value: oldFunctionZipUrl,
        },
      },
    },
  })
}

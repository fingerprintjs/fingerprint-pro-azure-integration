import { StringDictionary, WebSiteManagementClient } from '@azure/arm-appservice'
import { WEBSITE_RUN_FROM_PACKAGE } from './settings'
import { InvocationContext } from '@azure/functions'

export interface PerformRollbackParams {
  settings: StringDictionary
  client: WebSiteManagementClient
  resourceGroupName: string
  appName: string
  oldFunctionZipUrl: string
  logger?: InvocationContext
}

export async function performRollback({
  settings,
  client,
  resourceGroupName,
  appName,
  oldFunctionZipUrl,
  logger,
}: PerformRollbackParams) {
  if (!settings.properties) {
    settings.properties = {}
  }

  settings.properties[WEBSITE_RUN_FROM_PACKAGE] = oldFunctionZipUrl

  logger?.debug(`Rolling back to ${oldFunctionZipUrl}`)

  await client.webApps.updateApplicationSettings(resourceGroupName, appName, settings)
}

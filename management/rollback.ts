import { StringDictionary, WebSiteManagementClient } from '@azure/arm-appservice'
import { WEBSITE_RUN_FROM_PACKAGE } from './settings'
import { Logger } from '@azure/functions'

export interface PerformRollbackParams {
  settings: StringDictionary
  client: WebSiteManagementClient
  resourceGroupName: string
  appName: string
  oldFunctionZipUrl: string
  logger?: Logger
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

  logger?.verbose(`Rolling back to ${oldFunctionZipUrl}`)

  await client.webApps.updateApplicationSettings(resourceGroupName, appName, settings)
}

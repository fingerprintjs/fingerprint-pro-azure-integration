import { FunctionEnvelope, WebSiteManagementClient } from '@azure/arm-appservice'
import { STATUS_PATH, StatusFormat } from '../shared/status'
import { Logger } from '@azure/functions'

export async function getSiteStatusUrl(
  client: WebSiteManagementClient,
  resourceGroupName: string,
  siteName: string,
  logger?: Logger,
) {
  const proxyFunction = await findProxyFunction(client, resourceGroupName, siteName, logger)

  const functionUrl = parseFunctionUrl(proxyFunction)
  functionUrl.pathname = `${functionUrl.pathname}/${STATUS_PATH}`
  functionUrl.searchParams.set('format', StatusFormat.JSON)

  return functionUrl.toString()
}

async function findProxyFunction(
  client: WebSiteManagementClient,
  resourceGroupName: string,
  siteName: string,
  logger?: Logger,
) {
  const functions = client.webApps.listFunctions(resourceGroupName, siteName)

  for await (const fn of functions) {
    if (isProxyFunction(fn)) {
      return fn
    }

    logger?.verbose(`Function ${fn.name} is not a proxy function`)
  }

  throw new Error(`Could not find proxy function for ${siteName} in ${resourceGroupName} resource group`)
}

export function isProxyFunction(fn: FunctionEnvelope) {
  return (
    fn.config?.scriptFile === './fingerprintjs-pro-azure-function.js' ||
    fn.name?.endsWith('fingerprintjs-pro-azure-function')
  )
}

export function parseFunctionUrl(fn: FunctionEnvelope) {
  return new URL(fn.invokeUrlTemplate?.replace('/{*restofpath}', '') ?? '')
}

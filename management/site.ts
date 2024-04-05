import { FunctionEnvelope, WebSiteManagementClient } from '@azure/arm-appservice'
import { StatusFormat } from '../shared/status'
import { Logger } from '@azure/functions'
import { CustomerVariables } from '../shared/customer-variables/CustomerVariables'
import { EnvCustomerVariables } from '../shared/customer-variables/EnvCustomerVariables'
import { getStatusUri } from '../shared/customer-variables/selectors'
import { removeTrailingSlashes } from '../shared/routing'

export async function getSiteStatusUrl(
  client: WebSiteManagementClient,
  resourceGroupName: string,
  siteName: string,
  logger?: Logger
) {
  const customerVariables = new CustomerVariables([new EnvCustomerVariables()], logger)

  const proxyFunction = await findProxyFunction(client, resourceGroupName, siteName, logger)

  const functionUrl = parseFunctionUrl(proxyFunction)
  const statusPath = removeTrailingSlashes(await getStatusUri(customerVariables))

  functionUrl.pathname = `${removeTrailingSlashes(functionUrl.pathname)}/${statusPath}`
  functionUrl.searchParams.set('format', StatusFormat.JSON)

  return functionUrl.toString()
}

async function findProxyFunction(
  client: WebSiteManagementClient,
  resourceGroupName: string,
  siteName: string,
  logger?: Logger
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
    fn.config?.scriptFile === './fingerprint-pro-azure-function.js' ||
    fn.name?.endsWith('fingerprint-pro-azure-function')
  )
}

export function parseFunctionUrl(fn: FunctionEnvelope) {
  return new URL(fn.invokeUrlTemplate?.replace('/{*restofpath}', '') ?? '')
}

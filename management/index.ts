import { WebSiteManagementClient } from '@azure/arm-appservice'
import { ManagedIdentityCredential } from '@azure/identity'
import { BlobServiceClient } from '@azure/storage-blob'
import { getLatestFunctionZip } from './github'
import { gatherEnvs } from './env'
import { getSiteStatusUrl } from './site'
import { performHealthCheckAfterUpdate } from './healthCheck'
import { createPackageBackup } from './storage'
import { RELEASED_PACKAGE_BLOB, USER_ASSIGNED_ENTITY_CLIENT_ID } from './settings'
import { config } from './config'
import crypto from 'crypto'
import { TimerHandler } from '@azure/functions/types/timer'

const managementFn: TimerHandler = async (timer, context) => {
  if (timer.isPastDue) {
    context.log('Timer function is running late!')
  }

  if (typeof global.crypto === 'undefined') {
    context.log('Crypto not available, using webcrypto')

    // @azure/arm-appservice uses library under the hood which needs access to global crypto object
    Object.assign(global, {
      crypto: crypto.webcrypto,
    })
  }

  const env = gatherEnvs(context)

  if (!env) {
    return
  }

  const { resourceGroupName, appName, subscriptionId } = env

  const latestFunction = await getLatestFunctionZip(
    context,
    process.env.GITHUB_TOKEN,
    config.version,
    env.allowPrerelease
  )

  if (!latestFunction) {
    context.info('No new release found')

    return
  }

  context.debug('latestFunction', latestFunction)

  try {
    const clientId = process.env[USER_ASSIGNED_ENTITY_CLIENT_ID]
    const credentials = new ManagedIdentityCredential({
      clientId: clientId,
    })
    context.info('Got client id', clientId)

    const client = new WebSiteManagementClient(credentials, subscriptionId)
    const [site, statusUrl] = await Promise.all([
      client.webApps.get(resourceGroupName, appName),
      getSiteStatusUrl(client, resourceGroupName, appName, context),
    ])

    const containerUrl = site.functionAppConfig?.deployment?.storage?.value

    if (!containerUrl) {
      context.warn('No deployment storage URL found in functionAppConfig')

      return
    }

    context.debug('Container URL', containerUrl)

    const storageUrl = new URL(containerUrl)
    const accountName = storageUrl.hostname.split('.')[0]
    const containerName = storageUrl.pathname.split('/').filter(Boolean)[0]

    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credentials)
    const containerClient = blobServiceClient.getContainerClient(containerName)

    await createPackageBackup(containerClient, context)

    await containerClient.getBlockBlobClient(RELEASED_PACKAGE_BLOB).uploadData(latestFunction.file)
    context.debug('Uploaded new package', latestFunction.version)
    context.debug('Restarting function app')
    const restartApp = async () => {
      context.debug('Restarting function app')
      await client.webApps.restart(resourceGroupName, appName)
      context.debug('Function app restarted')
    }

    await restartApp()

    await performHealthCheckAfterUpdate({
      newVersion: latestFunction.version,
      statusUrl,
      storageClient: containerClient,
      logger: context,
      restartApp,
    })
  } catch (error) {
    context.error(error)
  }
}

export default managementFn

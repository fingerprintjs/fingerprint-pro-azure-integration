import { WebSiteManagementClient } from '@azure/arm-appservice'
import { ManagedIdentityCredential } from '@azure/identity'
import { BlobServiceClient } from '@azure/storage-blob'
import { getLatestFunctionZip } from './github'
import { gatherEnvs } from './env'
import { getSiteStatusUrl } from './site'
import { performHealthCheckAfterUpdate } from './healthCheck'
import { USER_ASSIGNED_ENTITY_CLIENT_ID } from './settings'
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

    const deploymentStorage = site.functionAppConfig?.deployment?.storage
    context.debug('Deployment storage', deploymentStorage)
    const containerUrl = deploymentStorage?.value

    if (!containerUrl) {
      context.warn('No deployment storage URL found in functionAppConfig')

      return
    }

    context.debug('Container URL', containerUrl)

    const storageUrl = new URL(containerUrl)
    const accountName = storageUrl.hostname.split('.')[0]
    const containerName = storageUrl.pathname.split('/').filter(Boolean)[0]

    const blobName = 'released-package.zip'
    const newBlobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`

    context.debug('New function blob URL', newBlobUrl)

    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credentials)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.uploadData(latestFunction.file)

    await client.webApps.beginCreateOrUpdateAndWait(resourceGroupName, appName, {
      ...site,
      functionAppConfig: {
        ...site.functionAppConfig,
        deployment: {
          ...site.functionAppConfig?.deployment,
          storage: {
            ...deploymentStorage,
            value: newBlobUrl,
          },
        },
      },
    })

    await performHealthCheckAfterUpdate({
      newVersion: latestFunction.version,
      statusUrl,
      oldFunctionZipUrl: containerUrl,
      logger: context,
      resourceGroupName,
      appName,
      client,
      site,
      storageClient: containerClient,
      newFunctionZipUrl: newBlobUrl,
    })
  } catch (error) {
    context.error(error)
  }
}

export default managementFn

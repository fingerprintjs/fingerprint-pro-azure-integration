import { WebSiteManagementClient } from '@azure/arm-appservice'
import { ManagedIdentityCredential } from '@azure/identity'
import * as storageBlob from '@azure/storage-blob'
import { BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob'
import { StorageManagementClient } from '@azure/arm-storage'
import { getLatestFunctionZip } from './github'
import { gatherEnvs } from './env'
import { getSiteStatusUrl } from './site'
import { performHealthCheckAfterUpdate } from './healthCheck'
import { USER_ASSIGNED_ENTITY_CLIENT_ID, WEBSITE_RUN_FROM_PACKAGE } from './settings'
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

    const storageArmClient = new StorageManagementClient(credentials, subscriptionId)
    const client = new WebSiteManagementClient(credentials, subscriptionId)
    const [settings, statusUrl] = await Promise.all([
      client.webApps.listApplicationSettings(resourceGroupName, appName),
      getSiteStatusUrl(client, resourceGroupName, appName, context),
    ])

    const oldFunctionZipUrl = settings.properties?.[WEBSITE_RUN_FROM_PACKAGE]

    if (oldFunctionZipUrl) {
      context.debug('storageUrl', oldFunctionZipUrl)

      const storageUrl = new URL(oldFunctionZipUrl)
      const storageName = storageUrl.pathname.split('/')[1]
      const accountName = storageUrl.hostname.split('.')[0]

      context.debug('storageName', storageName)
      context.debug('accountName', accountName)

      const { keys } = await storageArmClient.storageAccounts.listKeys(resourceGroupName, accountName)

      const key = keys?.[0].value

      if (!key) {
        context.warn('No storage keys found')

        return
      }

      const containerUrl = `${storageUrl.origin}/${storageName}`
      const storageClient = new storageBlob.ContainerClient(
        containerUrl,
        // We must use StorageSharedKeyCredential in order to generate SAS tokens
        new StorageSharedKeyCredential(accountName, key)
      )

      const blobClient = storageClient.getBlockBlobClient(latestFunction.name)

      await blobClient.uploadData(latestFunction.file)

      const sas = await blobClient.generateSasUrl({
        startsOn: new Date(),
        expiresOn: getSasExpiration(),
        permissions: BlobSASPermissions.from({
          read: true,
        }),
      })

      context.debug('sas', sas)

      settings.properties![WEBSITE_RUN_FROM_PACKAGE] = sas

      await client.webApps.updateApplicationSettings(resourceGroupName, appName, settings)

      await performHealthCheckAfterUpdate({
        newVersion: latestFunction.version,
        statusUrl,
        oldFunctionZipUrl: oldFunctionZipUrl,
        logger: context,
        resourceGroupName,
        appName,
        client,
        settings,
        storageClient,
        newFunctionZipUrl: sas,
      })
    }
  } catch (error) {
    context.error(error)
  }
}

function getSasExpiration() {
  // By default, when deploying using Azure CLI they generate a SAS token that expires in 10 years
  const expirationYears = 10
  const expiresOn = new Date()

  expiresOn.setFullYear(expiresOn.getFullYear() + expirationYears)

  return expiresOn
}

export default managementFn

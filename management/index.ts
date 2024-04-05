import { AzureFunction, Context, Timer } from '@azure/functions'
import { WebSiteManagementClient } from '@azure/arm-appservice'
import { ManagedIdentityCredential } from '@azure/identity'
import * as storageBlob from '@azure/storage-blob'
import { BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob'
import { StorageManagementClient } from '@azure/arm-storage'
import { getLatestFunctionZip } from './github'
import { gatherEnvs } from './env'
import { getSiteStatusUrl } from './site'
import { performHealthCheckAfterUpdate } from './healthCheck'
import { WEBSITE_RUN_FROM_PACKAGE, USER_ASSIGNED_ENTITY_CLIENT_ID } from './settings'
import { config } from './config'

const managementFn: AzureFunction = async (context: Context, timer: Timer) => {
  if (timer.isPastDue) {
    context.log('Timer function is running late!')
  }

  const env = gatherEnvs(context.log)

  if (!env) {
    return
  }

  const { resourceGroupName, appName, subscriptionId } = env

  const latestFunction = await getLatestFunctionZip(
    context.log,
    process.env.GITHUB_TOKEN,
    config.version,
    env.allowPrerelease
  )

  if (!latestFunction) {
    context.log.info('No new release found')

    return
  }

  context.log.verbose('latestFunction', latestFunction)

  try {
    const clientId = process.env[USER_ASSIGNED_ENTITY_CLIENT_ID]
    const credentials = new ManagedIdentityCredential({
      clientId: clientId,
    })
    context.log.info('Got client id', clientId)

    const storageArmClient = new StorageManagementClient(credentials, subscriptionId)
    const client = new WebSiteManagementClient(credentials, subscriptionId)
    const [settings, statusUrl] = await Promise.all([
      client.webApps.listApplicationSettings(resourceGroupName, appName),
      getSiteStatusUrl(client, resourceGroupName, appName, context.log),
    ])

    const oldFunctionZipUrl = settings.properties?.[WEBSITE_RUN_FROM_PACKAGE]

    if (oldFunctionZipUrl) {
      context.log.verbose('storageUrl', oldFunctionZipUrl)

      const storageUrl = new URL(oldFunctionZipUrl)
      const storageName = storageUrl.pathname.split('/')[1]
      const accountName = storageUrl.hostname.split('.')[0]

      context.log.verbose('storageName', storageName)
      context.log.verbose('accountName', accountName)

      const { keys } = await storageArmClient.storageAccounts.listKeys(resourceGroupName, accountName)

      const key = keys?.[0].value

      if (!key) {
        context.log.warn('No storage keys found')

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

      context.log.verbose('sas', sas)

      settings.properties![WEBSITE_RUN_FROM_PACKAGE] = sas

      await client.webApps.updateApplicationSettings(resourceGroupName, appName, settings)

      await performHealthCheckAfterUpdate({
        newVersion: latestFunction.version,
        statusUrl,
        oldFunctionZipUrl: oldFunctionZipUrl,
        logger: context.log,
        resourceGroupName,
        appName,
        client,
        settings,
        storageClient,
        newFunctionZipUrl: sas,
      })
    }
  } catch (error) {
    context.log.error(error)
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

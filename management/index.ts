import { AzureFunction, Context } from '@azure/functions'
import { WebSiteManagementClient } from '@azure/arm-appservice'
import { DefaultAzureCredential } from '@azure/identity'
import * as storageBlob from '@azure/storage-blob'
import { BlobProperties, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob'
import { StorageManagementClient } from '@azure/arm-storage'

// TODO These values must come from ENV
const resourceGroupName = 'fpjs-proxy-integration'
const appName = 'fpjs-proxy-integration-test'
const subscriptionId = 'fb04eab4-40ef-4df0-b1df-4bd5c3dd8eaf'

const WEBSITE_RUN_FROM_PACKAGE = 'WEBSITE_RUN_FROM_PACKAGE'

const storageBlobTrigger: AzureFunction = async (context: Context, blob: Buffer) => {
  console.debug('typeof', typeof blob)

  const blobData = context.bindingData.properties as BlobProperties

  console.debug('blobData', blobData)

  try {
    const credentials = new DefaultAzureCredential()

    const storageArmClient = new StorageManagementClient(credentials, subscriptionId)
    const client = new WebSiteManagementClient(credentials, subscriptionId)

    const settings = await client.webApps.listApplicationSettings(resourceGroupName, appName)
    const setting = settings.properties?.[WEBSITE_RUN_FROM_PACKAGE]

    if (setting) {
      console.log('storageUrl', setting)

      const storageUrl = new URL(setting)
      const storageName = storageUrl.pathname.split('/')[1]
      const accountName = storageUrl.hostname.split('.')[0]

      console.debug('storageName', storageName)
      console.debug('accountName', accountName)

      const { keys } = await storageArmClient.storageAccounts.listKeys(resourceGroupName, accountName)

      const key = keys?.[0].value

      if (!key) {
        console.warn('No storage keys found')

        return
      }

      const containerUrl = `${storageUrl.origin}/${storageName}`
      const storageClient = new storageBlob.ContainerClient(
        containerUrl,
        // We must use StorageSharedKeyCredential in order to generate SAS tokens
        new StorageSharedKeyCredential(accountName, key),
      )

      // TODO We should come up with more clever naming, maybe include version number?
      const blobClient = storageClient.getBlockBlobClient('func.zip')

      const uploadResult = await blobClient.uploadData(blob)

      console.debug('uploadResult', uploadResult._response)

      const sas = await blobClient.generateSasUrl({
        startsOn: new Date(),
        expiresOn: getSasExpiration(),
        permissions: BlobSASPermissions.from({
          read: true,
        }),
      })

      console.debug('sas', sas)

      settings.properties![WEBSITE_RUN_FROM_PACKAGE] = sas

      await client.webApps.updateApplicationSettings(resourceGroupName, appName, settings)
    }
  } catch (error) {
    console.error(error)
  }
}

function getSasExpiration() {
  // By default, when deploying using Azure CLI they generate a SAS token that expires in 10 years
  const expirationYears = 10
  const expiresOn = new Date()

  expiresOn.setFullYear(expiresOn.getFullYear() + expirationYears)

  return expiresOn
}

export default storageBlobTrigger

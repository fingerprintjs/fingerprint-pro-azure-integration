import * as fs from 'fs'
import * as path from 'path'
import * as storageBlob from '@azure/storage-blob'
import { BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob'
import invariant from 'tiny-invariant'
import deploymentTemplate from '../../azuredeploy.json'
import config from './config'
import { storageClient } from './clients'

const functionZipPath = path.resolve(__dirname, '../../package.zip')
if (!fs.existsSync(functionZipPath)) {
  throw new Error(`Built functions zip not found at: ${functionZipPath}`)
}

/**
 * Updates deployment template with function url stored in temp storage
 * */
export async function getUpdatedDeployTemplate(functionUrl: string) {
  const deployConfig: any = {
    ...deploymentTemplate,
  }

  /**
   * Maps to following property in azuredeploy.json:
   * {
   *     "name": "WEBSITE_RUN_FROM_PACKAGE",
   *     "value": "https://fpjsdeploymentstorage.blob.core.windows.net/funcs/package.zip"
   * },
   * We have to overwrite it, in order to use function built locally in the infrastructure
   * */
  deployConfig.resources[8].properties.siteConfig.appSettings[8].value = functionUrl

  return deployConfig
}

export async function getTmpStorageContainerClient() {
  const url = `https://${config.storageAccountName}.blob.core.windows.net/${config.storageContainerName}`

  const { keys } = await storageClient.storageAccounts.listKeys(config.storageResourceGroup, config.storageAccountName)

  const key = keys?.[0].value
  invariant(key, 'Storage key not found')

  return new storageBlob.ContainerClient(url, new StorageSharedKeyCredential(config.storageAccountName, key))
}

/**
 * Deploy built package.zip to temporary storage account, so that the deployment can access it.
 * */
export async function deployAppToTempStorage() {
  const containerClient = await getTmpStorageContainerClient()
  const blobName = `package-${Date.now()}.zip`
  const blobClient = containerClient.getBlockBlobClient(blobName)

  const zip = fs.readFileSync(functionZipPath)

  await blobClient.uploadData(zip)

  return {
    blobName,
    url: await blobClient.generateSasUrl({
      permissions: BlobSASPermissions.from({
        read: true,
      }),
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    }),
    removeBlob: async () => {
      console.info(`Removing blob ${blobName}`)

      await blobClient.delete()
    },
  }
}

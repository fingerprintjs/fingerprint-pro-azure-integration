import * as fs from 'fs'
import * as path from 'path'
import * as storageBlob from '@azure/storage-blob'
import { BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob'
import invariant from 'tiny-invariant'
import deploymentTemplate from '../../azuredeploy.json'
import { doHealthCheck } from './healthCheck'
import config from './config'
import { resourcesClient, storageClient } from './clients'
import { getWebApp } from './site'

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
  deployConfig.resources[3].properties.siteConfig.appSettings[6].value = functionUrl

  return deployConfig
}

/**
 * Deploy built package.zip to temporary storage account, so that the deployment can access it.
 * */
export async function deployAppToTempStorage() {
  const url = `https://${config.storageAccountName}.blob.core.windows.net/${config.storageContainerName}`

  console.info(`Deploying package.zip to ${url}...`)

  const { keys } = await storageClient.storageAccounts.listKeys(config.storageResourceGroup, config.storageAccountName)

  const key = keys?.[0].value
  invariant(key, 'Storage key not found')

  const containerClient = new storageBlob.ContainerClient(
    url,
    new StorageSharedKeyCredential(config.storageAccountName, key),
  )
  const blobName = `package-${Date.now()}.zip`
  const blobClient = containerClient.getBlockBlobClient(blobName)

  const zip = fs.readFileSync(functionZipPath)

  await blobClient.uploadData(zip)

  return {
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

/**
 * Deploys function app to resource group using given template
 * */
export async function deployFunctionApp(resourceGroup: string, template: Record<string, unknown>) {
  const appName = `fpjs-dev-e2e-app-${Date.now()}`

  console.info(`Deploying app ${appName} to ${resourceGroup} resource group`)

  const poll = await resourcesClient.deployments.beginCreateOrUpdate(resourceGroup, `${resourceGroup}-deployment`, {
    properties: {
      template,
      parameters: {
        preSharedSecret: {
          value: config.preSharedSecret,
        },
        functionAppName: {
          value: appName,
        },
      },
      mode: 'Incremental',
    },
  })

  await poll.pollUntilDone()

  console.info(`App deployed, requesting details from Azure...`)

  const website = await getWebApp(resourceGroup, appName)
  invariant(website.name, 'Website name is required')

  console.info(`App deployed with id #${website.id} 🎉`)
  console.info('Performing health check...')

  await doHealthCheck(website.name)

  console.info('Health check passed!')

  return website
}

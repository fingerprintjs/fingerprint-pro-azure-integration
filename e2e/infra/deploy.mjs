import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as storageBlob from '@azure/storage-blob'
import { BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob'
import { StorageManagementClient } from '@azure/arm-storage'
import { ResourceManagementClient } from '@azure/arm-resources'
import { DefaultAzureCredential } from '@azure/identity'
import invariant from 'tiny-invariant'
import { createResourceGroup, removeResourceGroup } from './resourceGroup.mjs'
import { $ } from 'zx'

const credentials = new DefaultAzureCredential()

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID
invariant(subscriptionId, 'AZURE_SUBSCRIPTION_ID is required')

const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
invariant(storageAccountName, 'AZURE_STORAGE_ACCOUNT_NAME is required')

const storageContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME
invariant(storageContainerName, 'AZURE_STORAGE_CONTAINER_NAME is required')

const storageResourceGroup = process.env.AZURE_STORAGE_RESOURCE_GROUP
invariant(storageResourceGroup, 'AZURE_STORAGE_RESOURCE_GROUP is required')

const storageClient = new StorageManagementClient(credentials, subscriptionId)
const resourcesClient = new ResourceManagementClient(credentials, subscriptionId)

const dirname = path.dirname(fileURLToPath(import.meta.url))

const deployFiles = [
  path.resolve(dirname, '../../azuredeploy.json'),
  path.resolve(dirname, '../../azuredeploy.parameters.json'),
]

const functionZipPath = path.resolve(dirname, '../../package.zip')
if (!fs.existsSync(functionZipPath)) {
  throw new Error(`Built functions zip not found at: ${functionZipPath}`)
}

async function main() {
  copyDeploymentFiles()

  const resourceGroup = await createResourceGroup(resourcesClient)

  try {
    const functionUrl = await deployAppToTempStorage(resourceGroup)

    await updateDeployConfiguration(functionUrl)
    await deploy(resourceGroup)
  } finally {
    await removeResourceGroup(resourceGroup, resourcesClient)
  }
}

async function updateDeployConfiguration(functionUrl) {
  const deployConfig = await import('./azuredeploy.json', { assert: { type: 'json' } }).then((mod) => mod.default)

  deployConfig.resources[3].properties.siteConfig.appSettings[6].value = functionUrl

  fs.writeFileSync(path.resolve(dirname, 'azuredeploy.json'), JSON.stringify(deployConfig, null, 2))
}

/**
 * Deploy built package.zip to temporary storage account, so that the deployment can access it.
 * */
async function deployAppToTempStorage(resourceGroupName) {
  const url = `https://${storageAccountName}.blob.core.windows.net/${storageContainerName}`

  console.info(`Deploying package.zip to ${url}...`)

  const { keys } = await storageClient.storageAccounts.listKeys(storageResourceGroup, storageAccountName)

  const key = keys?.[0].value

  const containerClient = new storageBlob.ContainerClient(url, new StorageSharedKeyCredential(storageAccountName, key))
  const blobClient = containerClient.getBlockBlobClient('package.zip')

  const zip = fs.readFileSync(functionZipPath)

  await blobClient.uploadData(zip)

  return blobClient.generateSasUrl({
    permissions: BlobSASPermissions.from({
      read: true,
    }),
    startsOn: new Date(),
    expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  })
}

async function deploy(resourceGroup) {
  // TODO Remove zx
  await $`az deployment group create --resource-group ${resourceGroup} --template-file ${path.resolve(
    dirname,
    'azuredeploy.json',
  )} --parameters ${path.resolve(dirname, 'azuredeploy.parameters.json')}`
}

function copyDeploymentFiles() {
  for (const file of deployFiles) {
    const filename = path.basename(file)
    const target = path.resolve(dirname, filename)

    fs.copyFileSync(file, target)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

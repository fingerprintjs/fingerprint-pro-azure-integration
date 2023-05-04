import { removeResourceGroup } from '../resourceGroup'
import { deleteTestInfo, readTestInfo } from '../../shared/testInfo'
import { getTmpStorageContainerClient } from '../tmpStorage'

async function main() {
  const testInfo = readTestInfo()

  try {
    const containerClient = await getTmpStorageContainerClient()
    const blobClient = containerClient.getBlockBlobClient(testInfo.functionBlobName)
    await blobClient.delete()

    console.info(`Deleted blob ${testInfo.functionBlobName}`)
  } catch (error) {
    console.error(`Failed to delete blob ${testInfo.functionBlobName}`, error)
  }

  await removeResourceGroup(testInfo.resourceGroup)

  deleteTestInfo()
}

main().catch((error) => {
  console.error(error)

  process.exit(1)
})

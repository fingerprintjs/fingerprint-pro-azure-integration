import type { TestInfo } from '../shared/testInfo.ts'
import { getTmpStorageContainerClient } from './tmpStorage.ts'

export async function destroyTestInfo(testInfo: TestInfo) {
  try {
    const containerClient = await getTmpStorageContainerClient()
    const blobClient = containerClient.getBlockBlobClient(testInfo.functionBlobName)
    await blobClient.delete()

    console.info(`Deleted blob ${testInfo.functionBlobName}`)
  } catch (error) {
    console.error(`Failed to delete blob ${testInfo.functionBlobName}`, error)
  }
}

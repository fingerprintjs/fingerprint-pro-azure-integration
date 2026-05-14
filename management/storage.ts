import { ContainerClient } from '@azure/storage-blob'
import { InvocationContext } from '@azure/functions'

export function removeOldFunctionFromStorage(
  oldZipUrl: string,
  newZipUrl: string,
  storageClient: ContainerClient,
  logger?: InvocationContext
) {
  const oldZipName = extractBlobName(oldZipUrl)
  const newZipName = extractBlobName(newZipUrl)

  if (!oldZipName || oldZipName === newZipName) {
    logger?.debug('Old function zip is the same as the new one or has no blob name, skipping removal')

    return
  }

  logger?.debug(`Removing old function zip file ${oldZipName} from storage`)

  return storageClient.deleteBlob(oldZipName)
}

export function extractBlobName(fileUrl: string) {
  const url = new URL(fileUrl)

  const zipUrlParts = url.pathname.split('/')

  return zipUrlParts[zipUrlParts.length - 1]
}

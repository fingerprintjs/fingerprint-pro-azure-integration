import { ContainerClient } from '@azure/storage-blob'
import { Logger } from '@azure/functions'

export function removeOldFunctionFromStorage(
  oldZipUrl: string,
  newZipUrl: string,
  storageClient: ContainerClient,
  logger?: Logger
) {
  const oldZipName = extractBlobName(oldZipUrl)
  const newZipName = extractBlobName(newZipUrl)

  if (oldZipName === newZipName) {
    logger?.verbose('Old function zip is the same as the new one, skipping removal')

    return
  }

  logger?.verbose(`Removing old function zip file ${oldZipName} from storage`)

  return storageClient.deleteBlob(oldZipName)
}

export function extractBlobName(fileUrl: string) {
  const url = new URL(fileUrl)

  const zipUrlParts = url.pathname.split('/')

  return zipUrlParts[zipUrlParts.length - 1]
}

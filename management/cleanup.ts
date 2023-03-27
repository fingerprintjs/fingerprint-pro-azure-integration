import { ContainerClient } from '@azure/storage-blob'
import { Logger } from '@azure/functions'

export function removeOldFunctionFromStorage(zipUrl: string, storageClient: ContainerClient, logger: Logger) {
  const url = new URL(zipUrl)

  const zipUrlParts = url.pathname.split('/')
  const zipName = zipUrlParts[zipUrlParts.length - 1]

  logger.verbose(`Removing old function zip file ${zipName} from storage`)

  return storageClient.deleteBlob(zipName)
}

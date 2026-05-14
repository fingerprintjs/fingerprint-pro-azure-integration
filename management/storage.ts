import { ContainerClient } from '@azure/storage-blob'
import { InvocationContext } from '@azure/functions'
import { BACKUP_PACKAGE_BLOB, RELEASED_PACKAGE_BLOB } from './settings'

export async function createPackageBackup(containerClient: ContainerClient, logger?: InvocationContext) {
  logger?.debug('Creating backup of current released package')
  const sourceClient = containerClient.getBlockBlobClient(RELEASED_PACKAGE_BLOB)
  const destClient = containerClient.getBlockBlobClient(BACKUP_PACKAGE_BLOB)
  const poller = await destClient.beginCopyFromURL(sourceClient.url)
  await poller.pollUntilDone()
}

export async function restorePackageFromBackup(containerClient: ContainerClient, logger?: InvocationContext) {
  logger?.debug('Restoring released package from backup')
  const sourceClient = containerClient.getBlockBlobClient(BACKUP_PACKAGE_BLOB)
  const destClient = containerClient.getBlockBlobClient(RELEASED_PACKAGE_BLOB)
  const poller = await destClient.beginCopyFromURL(sourceClient.url)
  await poller.pollUntilDone()
}

export async function deletePackageBackup(containerClient: ContainerClient, logger?: InvocationContext) {
  logger?.debug('Deleting package backup')
  await containerClient.deleteBlob(BACKUP_PACKAGE_BLOB)
}

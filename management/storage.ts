import { ContainerClient } from '@azure/storage-blob'
import { InvocationContext } from '@azure/functions'
import { BACKUP_PACKAGE_BLOB, RELEASED_PACKAGE_BLOB } from './settings.ts'

export async function createPackageBackup(containerClient: ContainerClient, logger?: InvocationContext) {
  const sourceClient = containerClient.getBlockBlobClient(RELEASED_PACKAGE_BLOB)
  const destClient = containerClient.getBlockBlobClient(BACKUP_PACKAGE_BLOB)

  if (await destClient.exists()) {
    logger?.debug('Deleting existing backup', destClient.url)
    await destClient.delete()
  }

  logger?.debug('Creating backup of current released package', sourceClient.url, '->', destClient.url)
  const poller = await destClient.beginCopyFromURL(sourceClient.url)
  await poller.pollUntilDone()
  logger?.debug('Backup created', BACKUP_PACKAGE_BLOB)
}

export async function restorePackageFromBackup(containerClient: ContainerClient, logger?: InvocationContext) {
  logger?.debug('Restoring released package from backup')
  const sourceClient = containerClient.getBlockBlobClient(BACKUP_PACKAGE_BLOB)
  const destClient = containerClient.getBlockBlobClient(RELEASED_PACKAGE_BLOB)
  const poller = await destClient.beginCopyFromURL(sourceClient.url)
  await poller.pollUntilDone()
}

export async function deletePackageBackup(containerClient: ContainerClient, logger?: InvocationContext) {
  logger?.debug('Deleting package backup', BACKUP_PACKAGE_BLOB)
  try {
    await containerClient.deleteBlob(BACKUP_PACKAGE_BLOB)
  } catch (e) {
    logger?.error('Failed to delete package backup', e)
  }
}

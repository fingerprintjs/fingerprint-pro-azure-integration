import { ContainerClient } from '@azure/storage-blob'
import { InvocationContext } from '@azure/functions'
import { restorePackageFromBackup } from './storage.ts'

export interface PerformRollbackParams {
  storageClient: ContainerClient
  logger?: InvocationContext
  restartApp?: () => Promise<void>
}

export async function performRollback({ storageClient, logger, restartApp }: PerformRollbackParams) {
  logger?.debug('Rolling back to previous package')
  await restorePackageFromBackup(storageClient, logger)
  await restartApp?.()
}

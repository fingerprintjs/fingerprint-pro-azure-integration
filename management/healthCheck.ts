import { InvocationContext } from '@azure/functions'
import { StatusInfo } from '../shared/status'
import { ContainerClient } from '@azure/storage-blob'
import { performRollback } from './rollback'
import { deletePackageBackup } from './storage'
import { eq } from 'semver'
import { ConstantBackoff, handleAll, retry } from 'cockatiel'

export interface PerformHealthCheckAfterUpdateParams {
  newVersion: string
  logger?: InvocationContext
  statusUrl: string
  storageClient: ContainerClient
  checkInterval?: number
  restartApp: () => Promise<void>
}

export async function performHealthCheckAfterUpdate({
  newVersion,
  statusUrl,
  logger,
  storageClient,
  checkInterval,
  restartApp,
}: PerformHealthCheckAfterUpdateParams) {
  try {
    await runHealthCheckSchedule(statusUrl, newVersion, checkInterval, logger)
    await deletePackageBackup(storageClient, logger)
  } catch (error) {
    logger?.error('Health check failed', error)

    await performRollback({
      storageClient,
      logger,
      restartApp,
    })

    throw error
  }
}

async function runHealthCheckSchedule(
  url: string,
  newVersion: string,
  checkInterval = 10_000,
  logger?: InvocationContext
) {
  logger?.debug(`Starting health check at ${url}`)

  const policy = retry(handleAll, {
    maxAttempts: 20,
    backoff: new ConstantBackoff(checkInterval),
  })
  return policy.execute(async ({ attempt, signal }) => {
    if (attempt > 1) {
      logger?.debug(`Attempt ${attempt} at health check...`)
    }

    const response = await fetch(url, { signal })
    const json = (await response.json()) as StatusInfo

    logger?.debug('Health check response', json)

    if (eq(json.version, newVersion)) {
      logger?.info('Health check passed')

      return
    }

    throw new Error(`Version mismatch, expected: ${newVersion}, received: ${json.version}`)
  })
}

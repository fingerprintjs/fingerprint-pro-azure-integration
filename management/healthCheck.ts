import { Logger } from '@azure/functions'
import { StatusInfo } from '../shared/status'
import { StringDictionary, WebSiteManagementClient } from '@azure/arm-appservice'
import { performRollback } from './rollback'
import { ContainerClient } from '@azure/storage-blob'
import { removeOldFunctionFromStorage } from './storage'
import { eq } from 'semver'
import { ExponentialBackoff, handleAll, retry, timeout, TimeoutStrategy, wrap } from 'cockatiel'

export interface PerformHealthCheckAfterUpdateParams {
  newVersion: string
  newFunctionZipUrl: string
  oldFunctionZipUrl: string
  logger?: Logger
  statusUrl: string
  settings: StringDictionary
  client: WebSiteManagementClient
  resourceGroupName: string
  appName: string
  storageClient: ContainerClient
  timeoutMs?: number
}

export async function performHealthCheckAfterUpdate({
  newVersion,
  statusUrl,
  logger,
  settings,
  appName,
  client,
  resourceGroupName,
  oldFunctionZipUrl,
  storageClient,
  timeoutMs,
  newFunctionZipUrl,
}: PerformHealthCheckAfterUpdateParams) {
  try {
    await runHealthCheckSchedule(statusUrl, newVersion, timeoutMs, logger)

    await removeOldFunctionFromStorage(oldFunctionZipUrl, newFunctionZipUrl, storageClient, logger)
  } catch (error) {
    logger?.error('Health check failed', error)

    await performRollback({
      oldFunctionZipUrl,
      settings,
      appName,
      client,
      resourceGroupName,
      logger,
    })

    throw error
  }
}

async function runHealthCheckSchedule(url: string, newVersion: string, timeoutMs = 120_000, logger?: Logger) {
  const policy = wrap(
    timeout(timeoutMs, TimeoutStrategy.Aggressive).dangerouslyUnref(),
    retry(handleAll, {
      backoff: new ExponentialBackoff({
        initialDelay: 500,
      }),
    }),
  )

  return policy.execute(async ({ attempt, signal }) => {
    if (attempt > 1) {
      logger?.verbose(`Attempt ${attempt} at health check...`)
    }

    const response = await fetch(url, { signal })
    const json = (await response.json()) as StatusInfo

    logger?.verbose('Health check response', json)

    if (eq(json.version, newVersion)) {
      logger?.info('Health check passed')

      return
    }

    throw new Error(`Version mismatch, expected: ${newVersion}, received: ${json.version}`)
  })
}

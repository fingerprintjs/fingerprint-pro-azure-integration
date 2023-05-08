import { Logger } from '@azure/functions'
import { StatusInfo } from '../shared/status'
import { StringDictionary, WebSiteManagementClient } from '@azure/arm-appservice'
import { performRollback } from './rollback'
import { ContainerClient } from '@azure/storage-blob'
import { removeOldFunctionFromStorage } from './storage'
import { eq } from 'semver'
import { ExponentialBackoff, handleAll, retry } from 'cockatiel'

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
  maxHealthCheckDelayMs?: number
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
  maxHealthCheckDelayMs,
  newFunctionZipUrl,
}: PerformHealthCheckAfterUpdateParams) {
  try {
    await runHealthCheckSchedule(statusUrl, newVersion, maxHealthCheckDelayMs, logger)

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

async function runHealthCheckSchedule(url: string, newVersion: string, maxDelay = 15_000, logger?: Logger) {
  const policy = retry(handleAll, {
    maxAttempts: 20,
    backoff: new ExponentialBackoff({
      initialDelay: 500,
      maxDelay,
    }),
  })
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

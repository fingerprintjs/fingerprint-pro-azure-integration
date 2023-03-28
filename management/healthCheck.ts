import { Logger } from '@azure/functions'
import { StatusInfo } from '../shared/status'
import { StringDictionary, WebSiteManagementClient } from '@azure/arm-appservice'
import { performRollback } from './rollback'
import { ContainerClient } from '@azure/storage-blob'
import { removeOldFunctionFromStorage } from './storage'
import { eq } from 'semver'

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
  waitBetweenRequestsMs?: number
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
  waitBetweenRequestsMs,
  timeoutMs,
  newFunctionZipUrl,
}: PerformHealthCheckAfterUpdateParams) {
  const timeoutController = new AbortController()

  try {
    await Promise.race([
      runHealthCheckSchedule(statusUrl, newVersion, waitBetweenRequestsMs, logger),
      timeout(timeoutMs, timeoutController.signal),
    ])

    timeoutController.abort()

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

async function runHealthCheckSchedule(url: string, newVersion: string, waitBetweenRequestsMs = 5000, logger?: Logger) {
  let isOk = false

  logger?.verbose(`Performing health check on ${url} every ${waitBetweenRequestsMs}ms`)

  while (!isOk) {
    try {
      const response = await fetch(url)
      const json = (await response.json()) as StatusInfo

      logger?.verbose('Health check response', json)

      if (eq(json.version, newVersion)) {
        logger?.info('Health check passed')

        isOk = true
      }
    } catch (error) {
      logger?.error('Error while performing health check', error)
    } finally {
      if (!isOk) {
        await wait(waitBetweenRequestsMs)
      }
    }
  }
}

function timeout(ms = 1000 * 60 * 2, signal?: AbortSignal) {
  return new Promise((resolve, reject) => {
    wait(ms, signal).then(() => {
      reject(new Error('Operation Timeout'))
    })
  })
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, ms)

    timeout.unref()

    signal?.addEventListener('abort', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

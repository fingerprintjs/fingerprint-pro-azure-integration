import { Logger } from '@azure/functions'
import { StatusInfo } from '../shared/status'
import { StringDictionary, WebSiteManagementClient } from '@azure/arm-appservice'
import { performRollback } from './rollback'
import { ContainerClient } from '@azure/storage-blob'
import { removeOldFunctionFromStorage } from './cleanup'
import { eq } from 'semver'

export interface PerformHealthCheckAfterUpdateParams {
  newVersion: string
  oldFunctionZipUrl: string
  logger: Logger
  statusUrl: string
  settings: StringDictionary
  client: WebSiteManagementClient
  resourceGroupName: string
  appName: string
  storageClient: ContainerClient
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
}: PerformHealthCheckAfterUpdateParams) {
  try {
    await Promise.race([runHealthCheckSchedule(statusUrl, newVersion, logger), timeout()])

    await removeOldFunctionFromStorage(oldFunctionZipUrl, storageClient, logger)
  } catch (error) {
    logger.error('Health check failed', error)

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

async function runHealthCheckSchedule(url: string, newVersion: string, logger: Logger) {
  let isOk = false

  const waitBetweenRequestsMs = 5000

  logger.verbose(`Performing health check on ${url} every ${waitBetweenRequestsMs}ms`)

  while (!isOk) {
    try {
      const response = await fetch(url)
      const json = (await response.json()) as StatusInfo

      logger.verbose('Health check response', json)

      if (eq(json.version, newVersion)) {
        logger.info('Health check passed')

        isOk = true
      }
    } catch (error) {
      logger.error('Error while performing health check', error)
    } finally {
      if (!isOk) {
        await wait(waitBetweenRequestsMs)
      }
    }
  }
}

function timeout() {
  // 2 minutes
  const ms = 1000 * 60 * 2

  return new Promise((resolve, reject) => {
    wait(ms).then(() => {
      reject(new Error('Timeout'))
    })
  })
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

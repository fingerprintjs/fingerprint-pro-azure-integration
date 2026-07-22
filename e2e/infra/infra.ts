import type { TestInfo } from '../shared/testInfo.ts'
import { removeResourceGroupAndWait } from './resourceGroup.ts'
import { deployWebsite } from './website.ts'
import { deployAppToTempStorage, getUpdatedDeployTemplate } from './tmpStorage.ts'
import { deployFunctionApp, type FunctionAppDeploymentParameters } from './deployFunctionApp.ts'
import { assertIsTruthy } from '../../shared/assert.ts'
import { provisionFrontDoor } from './frontdoor.ts'
import { STATUS_PATH } from '../../shared/status.ts'

export interface DeployE2EInfrastructureOptions extends FunctionAppDeploymentParameters {
  resourceGroup: string
  name: string
}

export interface DeployE2EInfrastructureResult {
  testInfo: TestInfo
  waitForFrontDoor: () => Promise<void>
}

export async function deployE2EInfrastructure({
  resourceGroup,
  getResultPath,
  routePrefix,
  agentDownloadPath,
  name,
}: DeployE2EInfrastructureOptions): Promise<DeployE2EInfrastructureResult> {
  const cleanupFns: Array<() => Promise<void>> = []

  const cleanup = async () => {
    await Promise.all(cleanupFns.map((fn) => fn()))
    await removeResourceGroupAndWait(resourceGroup)
  }

  try {
    const website = await deployWebsite(resourceGroup, name)

    const { url: tmpStorageUrl, removeBlob, blobName } = await deployAppToTempStorage()

    cleanupFns.push(removeBlob)

    const template = getUpdatedDeployTemplate(tmpStorageUrl)

    const functionApp = await deployFunctionApp({
      template,
      resourceGroup,
      getResultPath,
      agentDownloadPath,
      routePrefix,
      name,
    })
    const functionAppHost = functionApp.hostNames?.[0] ?? functionApp.enabledHostNames?.[0]
    assertIsTruthy(functionAppHost, 'functionAppHost is required')
    console.info(`Function app URL: https://${functionAppHost}`)

    const { url: frontdoorUrl, waitForFrontDoor } = await provisionFrontDoor({
      resourceGroup,
      websiteHost: new URL(website.url).host,
      functionAppHost,
      functionHealthStatusPath: `/${routePrefix}/${STATUS_PATH}`,
      functionAppRoutePrefix: routePrefix,
      name,
    })

    console.info(`Front door URL: ${frontdoorUrl}`)

    return {
      waitForFrontDoor,
      testInfo: {
        frontdoorUrl,
        functionAppUrl: `https://${functionAppHost}`,
        websiteUrl: website.url,
        functionBlobUrl: tmpStorageUrl,
        functionBlobName: blobName,
        getResultPath,
        routePrefix,
        agentDownloadPath,
      },
    }
  } catch (error) {
    console.error(`Error deploying resources: ${String(error)}`)

    await cleanup()

    throw error
  }
}

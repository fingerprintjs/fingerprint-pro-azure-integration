import { TestInfo } from '../shared/testInfo'
import { removeResourceGroup } from './resourceGroup'
import { deployWebsite } from './website'
import { deployAppToTempStorage, getUpdatedDeployTemplate } from './tmpStorage'
import { deployFunctionApp, FunctionAppDeploymentParameters } from './deployFunctionApp'
import invariant from 'tiny-invariant'
import { provisionFrontDoor } from './frontdoor'
import { STATUS_PATH } from '../../shared/status'

export interface DeployE2EInfrastructureOptions extends FunctionAppDeploymentParameters {
  resourceGroup: string
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
}: DeployE2EInfrastructureOptions): Promise<DeployE2EInfrastructureResult> {
  const cleanupFns: Array<() => Promise<void>> = []

  const cleanup = async () => {
    await Promise.all(cleanupFns.map((fn) => fn()))
    await removeResourceGroup(resourceGroup)
  }

  try {
    const website = await deployWebsite(resourceGroup)

    const { url: tmpStorageUrl, removeBlob, blobName } = await deployAppToTempStorage()

    cleanupFns.push(removeBlob)

    const template = await getUpdatedDeployTemplate(tmpStorageUrl)

    const functionApp = await deployFunctionApp({
      template,
      resourceGroup,
      getResultPath,
      agentDownloadPath,
      routePrefix,
    })
    const functionAppHost = functionApp.hostNames?.[0]
    invariant(functionAppHost, 'functionAppHost is required')

    const { url: frontdoorUrl, waitForFrontDoor } = await provisionFrontDoor({
      resourceGroup,
      websiteHost: new URL(website.url).host,
      functionAppHost,
      functionHealthStatusPath: `/fpjs/${STATUS_PATH}`,
      functionAppRoutePrefix: routePrefix,
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
    console.error(`Error deploying resources: ${error}`)

    await cleanup()

    throw error
  }
}

import { TestInfo } from '../shared/testInfo'
import { removeResourceGroupAndWait } from './resourceGroup'
import { deployWebsite } from './website'
import { deployAppToTempStorage, getUpdatedDeployTemplate } from './tmpStorage'
import { deployFunctionApp, FunctionAppDeploymentParameters } from './deployFunctionApp'
import invariant from 'tiny-invariant'
import { provisionFrontDoor } from './frontdoor'
import { STATUS_PATH } from '../../shared/status'

export interface DeployE2EInfrastructureOptions extends FunctionAppDeploymentParameters {
  resourceGroup: string
  name: string
}

export interface DeployE2EInfrastructureResult {
  testInfo: TestInfo
  waitForFrontDoor: () => Promise<void>
}

export async function updateE2EInfrastructure({
  resourceGroup,
  getResultPath,
  agentDownloadPath,
  routePrefix,
  name,
}: DeployE2EInfrastructureOptions) {
  console.info('Updating infrastructure...')

  await deployWebsite(resourceGroup, name)

  const { url: tmpStorageUrl } = await deployAppToTempStorage()

  const template = await getUpdatedDeployTemplate(tmpStorageUrl)

  await deployFunctionApp({
    template,
    resourceGroup,
    getResultPath,
    agentDownloadPath,
    routePrefix,
    name,
  })

  console.info('Updated infrastructure deployed!')
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

    const template = await getUpdatedDeployTemplate(tmpStorageUrl)

    const functionApp = await deployFunctionApp({
      template,
      resourceGroup,
      getResultPath,
      agentDownloadPath,
      routePrefix,
      name,
    })
    const functionAppHost = functionApp.hostNames?.[0] || functionApp.enabledHostNames?.[0]
    invariant(functionAppHost, 'functionAppHost is required')

    const { url: frontdoorUrl, waitForFrontDoor } = await provisionFrontDoor({
      resourceGroup,
      websiteHost: new URL(website.url).host,
      functionAppHost,
      functionHealthStatusPath: `/fpjs/${STATUS_PATH}`,
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
    console.error(`Error deploying resources: ${error}`)

    await cleanup()

    throw error
  }
}

import { resourcesClient } from './clients'
import config from './config'
import { getWebApp } from './site'
import invariant from 'tiny-invariant'
import { doHealthCheck } from './healthCheck'
import { TestInfo } from '../shared/testInfo'

export type FunctionAppDeploymentParameters = Pick<TestInfo, 'routePrefix' | 'agentDownloadPath' | 'getResultPath'>

export interface DeployFunctionAppOptions extends FunctionAppDeploymentParameters {
  resourceGroup: string
  template: Record<string, unknown>
}

/**
 * Deploys function app to resource group using given template
 * */
export async function deployFunctionApp({
  resourceGroup,
  template,
  getResultPath,
  routePrefix,
  agentDownloadPath,
}: DeployFunctionAppOptions) {
  const appName = `fpjs-dev-e2e-app-${Date.now()}`

  console.info(`Deploying app ${appName} to ${resourceGroup} resource group`)

  await resourcesClient.deployments.beginCreateOrUpdateAndWait(resourceGroup, `${resourceGroup}-deployment`, {
    properties: {
      template,
      parameters: {
        preSharedSecret: {
          value: config.preSharedSecret,
        },
        functionAppName: {
          value: appName,
        },
        getResultPath: {
          value: getResultPath,
        },
        agentDownloadPath: {
          value: agentDownloadPath,
        },
        routePrefix: {
          value: routePrefix,
        },
      },
      mode: 'Incremental',
    },
  })

  console.info(`App deployed, requesting details from Azure...`)

  const website = await getWebApp(resourceGroup, appName)
  invariant(website.name, 'Website name is required')

  console.info(`App deployed with id #${website.id} 🎉`)
  console.info('Performing health check...')

  await doHealthCheck(website.name)

  console.info('Health check passed!')

  return website
}

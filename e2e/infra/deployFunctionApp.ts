import { deploymentsClient } from './clients.ts'
import config from './config.ts'
import { getWebApp } from './site.ts'
import { assertIsTruthy } from '../../shared/assert.ts'
import { doHealthCheck } from './healthCheck.ts'
import type { TestInfo } from '../shared/testInfo.ts'
import type { Site } from '@azure/arm-appservice'

export type FunctionAppDeploymentParameters = Pick<TestInfo, 'routePrefix' | 'agentDownloadPath' | 'getResultPath'>

export interface DeployFunctionAppOptions extends FunctionAppDeploymentParameters {
  resourceGroup: string
  template: Record<string, unknown>
  name: string
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
  name,
}: DeployFunctionAppOptions): Promise<Site> {
  const appName = `fpjs-dev-e2e-app-${name}-${resourceGroup.replace(/[^0-9]/gi, '')}`

  console.info(`Deploying app ${appName} to ${resourceGroup} resource group`)

  await deploymentsClient.deployments.createOrUpdate(resourceGroup, `${resourceGroup}-${name}-deployment`, {
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
        maximumInstanceCount: {
          value: 100,
        },
      },
      mode: 'Incremental',
    },
  })

  console.info(`App deployed, requesting details from Azure...`)

  const website = await getWebApp(resourceGroup, appName)
  assertIsTruthy(website.name, 'Website name is required')
  assertIsTruthy(website.id, 'Website id is required')

  console.info(`App deployed with id #${website.id} 🎉`)
  console.info('Performing health check...')

  await doHealthCheck(website.name, routePrefix)

  console.info('Health check passed!')

  return website
}

import { resourcesClient } from './clients'
import config from './config'
import { getWebApp } from './site'
import invariant from 'tiny-invariant'
import { doHealthCheck } from './healthCheck'

/**
 * Deploys function app to resource group using given template
 * */
export async function deployFunctionApp(resourceGroup: string, template: Record<string, unknown>) {
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
          value: config.getResultPath,
        },
        agentDownloadPath: {
          value: config.agentDownloadPath,
        },
        routePrefix: {
          value: config.routePrefix,
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

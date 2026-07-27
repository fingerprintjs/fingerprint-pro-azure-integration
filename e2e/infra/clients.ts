import { DefaultAzureCredential } from '@azure/identity'
import { ResourceManagementClient } from '@azure/arm-resources'
import config from './config.ts'
import { StorageManagementClient } from '@azure/arm-storage'
import { WebSiteManagementClient } from '@azure/arm-appservice'
import { DeploymentsClient } from '@azure/arm-resourcesdeployments'
import { CdnManagementClient } from '@azure/arm-cdn'

export const credentials = new DefaultAzureCredential()

export const cdnClient = new CdnManagementClient(credentials, config.subscriptionId)

export const storageClient = new StorageManagementClient(credentials, config.subscriptionId)
export const resourcesClient = new ResourceManagementClient(credentials, config.subscriptionId)
export const deploymentsClient = new DeploymentsClient(credentials, config.subscriptionId)
export const websiteManagementClient = new WebSiteManagementClient(credentials, config.subscriptionId)

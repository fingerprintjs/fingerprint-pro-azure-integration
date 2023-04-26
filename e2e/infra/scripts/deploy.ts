import { createResourceGroup, removeResourceGroup } from '../resourceGroup'
import { deployAppToTempStorage, getUpdatedDeployTemplate } from '../tmpStorage'
import { deployWebsite } from '../website'
import { provisionFrontDoor } from '../frontdoor'
import invariant from 'tiny-invariant'
import { writeTestInfo } from '../../shared/testInfo'
import { STATUS_PATH } from '../../../shared/status'
import { deployFunctionApp } from '../deployFunctionApp'

async function main() {
  const resourceGroup = await createResourceGroup()

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

    const functionApp = await deployFunctionApp(resourceGroup, template)
    const functionAppHost = functionApp.hostNames?.[0]
    invariant(functionAppHost, 'functionAppHost is required')

    const { url: frontdoorUrl } = await provisionFrontDoor({
      resourceGroup,
      websiteHost: new URL(website.url).host,
      functionAppHost,
      functionHealthStatusPath: `/fpjs/${STATUS_PATH}`,
    })

    console.info(`Front door URL: ${frontdoorUrl}`)

    await writeTestInfo({
      resourceGroup,
      frontdoorUrl,
      functionAppUrl: `https://${functionAppHost}`,
      websiteUrl: website.url,
      functionBlobUrl: tmpStorageUrl,
      functionBlobName: blobName,
    })
  } catch (error) {
    console.error(`Error deploying resources: ${error}`)

    await cleanup()

    throw error
  }
}

main().catch((error) => {
  console.error(error)

  process.exit(1)
})

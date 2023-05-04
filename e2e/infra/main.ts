import { createResourceGroup, removeResourceGroup } from './resourceGroup'
import { deployFunctionApp, deployAppToTempStorage, getUpdatedDeployTemplate } from './deploy'
import { deployWebsite } from './website'

async function main() {
  const resourceGroup = await createResourceGroup()

  const cleanupFns: Array<() => Promise<void>> = []

  try {
    await deployWebsite(resourceGroup)

    const { url, removeBlob } = await deployAppToTempStorage()

    cleanupFns.push(removeBlob)

    const template = await getUpdatedDeployTemplate(url)

    await deployFunctionApp(resourceGroup, template)
  } finally {
    await Promise.all(cleanupFns.map((fn) => fn()))
    await removeResourceGroup(resourceGroup)
  }
}

main().catch((error) => {
  console.error(error)

  process.exit(1)
})

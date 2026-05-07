import { createResourceGroup, removeResourceGroup, removeResourceGroupAndWait } from '../resourceGroup'
import { addTestInfo, deleteTestInfo, initTestInfo, safeReadTestInfo } from '../../shared/testInfo'
import {
  deployE2EInfrastructure,
  DeployE2EInfrastructureOptions,
  DeployE2EInfrastructureResult,
  updateE2EInfrastructure,
} from '../infra'
import { destroyTestInfo } from '../destroyTestInfo'

function getId() {
  return Math.random().toString(36).substring(2, 15)
}

async function main() {
  let isUpdate = false
  let resourceGroup: string

  const testInfo = safeReadTestInfo()
  if (testInfo) {
    isUpdate = true
    resourceGroup = testInfo.resourceGroup
  } else {
    resourceGroup = await createResourceGroup()

    initTestInfo(resourceGroup)
  }

  const variants: DeployE2EInfrastructureOptions[] = [
    {
      resourceGroup,
      routePrefix: 'fpjs',
      agentDownloadPath: 'agent',
      getResultPath: 'result',
      name: 'fpjs',
    },
    {
      resourceGroup,
      routePrefix: getId(),
      agentDownloadPath: getId(),
      getResultPath: getId(),
      name: 'dyn',
    },
  ]

  if (isUpdate) {
    for (const variant of variants) {
      await updateE2EInfrastructure(variant)
    }
  } else {
    const results: DeployE2EInfrastructureResult[] = []

    try {
      for (const variant of variants) {
        const result = await deployE2EInfrastructure(variant)

        results.push(result)

        addTestInfo(result.testInfo)
      }

      await Promise.all(results.map((r) => r.waitForFrontDoor()))
    } catch (error) {
      for (const result of results) {
        await destroyTestInfo(result.testInfo)
      }

      await removeResourceGroupAndWait(resourceGroup)

      throw error
    }
  }
}

async function cleanup() {
  console.info('Cleaning up before exiting...')
  const testInfo = safeReadTestInfo()

  if (testInfo) {
    await removeResourceGroup(testInfo.resourceGroup)
    deleteTestInfo()
  }

  console.info('Cleanup complete')
}

// Ctrl+C
process.on('SIGINT', async () => {
  await cleanup()
  process.exit(0)
})

// kill <pid> (default kill signal)
process.on('SIGTERM', async () => {
  await cleanup()
  process.exit(0)
})

main().catch((error) => {
  console.error(error)

  process.exit(1)
})

import { createResourceGroup, removeResourceGroup, removeResourceGroupAndWait } from '../resourceGroup.ts'
import { addTestInfo, deleteTestInfo, initTestInfo, safeReadTestInfo } from '../../shared/testInfo.ts'
import {
  deployE2EInfrastructure,
  type DeployE2EInfrastructureOptions,
  type DeployE2EInfrastructureResult,
} from '../infra.ts'
import { destroyTestInfo } from '../destroyTestInfo.ts'

function getId() {
  return Math.random().toString(36).substring(2, 15)
}

async function main() {
  const resourceGroup = await createResourceGroup()

  initTestInfo(resourceGroup)

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
process.on('SIGINT', () => {
  void cleanup()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error(error)
      process.exit(1)
    })
})

// kill <pid> (default kill signal)
process.on('SIGTERM', () => {
  void cleanup()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error(error)
      process.exit(1)
    })
})

main().catch((error: unknown) => {
  console.error(error)

  process.exit(1)
})

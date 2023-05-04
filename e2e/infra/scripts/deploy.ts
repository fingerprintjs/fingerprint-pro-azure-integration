import { createResourceGroup, removeResourceGroup } from '../resourceGroup'
import { writeTestInfo } from '../../shared/testInfo'
import { deployE2EInfrastructure, DeployE2EInfrastructureOptions, DeployE2EInfrastructureResult } from '../infra'
import { destroyTestInfo } from '../destroyTestInfo'

function getId() {
  return Math.random().toString(36).substring(2, 15)
}

async function main() {
  const resourceGroup = await createResourceGroup()

  const results: DeployE2EInfrastructureResult[] = []

  try {
    const variants: DeployE2EInfrastructureOptions[] = [
      {
        resourceGroup,
        routePrefix: 'fpjs',
        agentDownloadPath: 'agent',
        getResultPath: 'result',
      },
      {
        resourceGroup,
        routePrefix: getId(),
        agentDownloadPath: getId(),
        getResultPath: getId(),
      },
    ]

    for (const variant of variants) {
      const result = await deployE2EInfrastructure(variant)

      results.push(result)
    }

    await Promise.all(results.map((r) => r.waitForFrontDoor()))

    writeTestInfo(results.map((r) => r.testInfo))
  } catch (error) {
    for (const result of results) {
      await destroyTestInfo(result.testInfo)
    }

    await removeResourceGroup(resourceGroup)

    throw error
  }
}

main().catch((error) => {
  console.error(error)

  process.exit(1)
})

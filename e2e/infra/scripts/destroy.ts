import { removeResourceGroup } from '../resourceGroup'
import { deleteTestInfo, readTestInfo } from '../../shared/testInfo'
import { destroyTestInfo } from '../destroyTestInfo'

async function main() {
  const testInfo = readTestInfo()

  const resourceGroups = new Set(testInfo.map((t) => t.resourceGroup))

  for (const info of testInfo) {
    await destroyTestInfo(info)
  }

  for (const resourceGroup of resourceGroups) {
    await removeResourceGroup(resourceGroup)
  }

  deleteTestInfo()
}

main().catch((error) => {
  console.error(error)

  process.exit(1)
})

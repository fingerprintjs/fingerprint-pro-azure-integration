import { removeResourceGroup } from '../resourceGroup'
import { deleteTestInfo, readTestInfo } from '../../shared/testInfo'
import { destroyTestInfo } from '../destroyTestInfo'

async function main() {
  const testInfo = readTestInfo()

  for (const info of testInfo.tests) {
    await destroyTestInfo(info)
  }

  await removeResourceGroup(testInfo.resourceGroup)

  deleteTestInfo()
}

main().catch((error) => {
  console.error(error)

  process.exit(1)
})

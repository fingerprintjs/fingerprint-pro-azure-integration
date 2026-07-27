import { removeResourceGroup } from '../resourceGroup.ts'
import { deleteTestInfo, readTestInfo } from '../../shared/testInfo.ts'
import { destroyTestInfo } from '../destroyTestInfo.ts'

async function main() {
  const testInfo = readTestInfo()

  for (const info of testInfo.tests) {
    await destroyTestInfo(info)
  }

  await removeResourceGroup(testInfo.resourceGroup)

  deleteTestInfo()
}

main().catch((error: unknown) => {
  console.error(error)

  process.exit(1)
})

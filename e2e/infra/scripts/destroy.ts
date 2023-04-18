import { removeResourceGroup } from '../resourceGroup'
import { deleteTestInfo, readTestInfo } from '../../shared/testInfo'

async function main() {
  await removeResourceGroup(readTestInfo().resourceGroup)

  deleteTestInfo()
}

main().catch((error) => {
  console.error(error)

  process.exit(1)
})

import { readTestInfo } from '../shared/testInfo'
import { removeResourceGroup } from '../infra/resourceGroup'

export default async function teardown() {
  const testInfo = readTestInfo()

  await removeResourceGroup(testInfo.resourceGroup)
}

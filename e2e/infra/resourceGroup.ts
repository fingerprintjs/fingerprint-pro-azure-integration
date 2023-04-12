import { resourcesClient } from './clients'

export async function createResourceGroup() {
  const name = `fpjs-dev-e2e-${Date.now()}`

  await resourcesClient.resourceGroups.createOrUpdate(name, {
    location: 'westus2',
  })

  return name
}

export async function removeResourceGroup(name: string) {
  console.info('Removing resource group', name)

  const poll = await resourcesClient.resourceGroups.beginDelete(name)

  await poll.pollUntilDone()
}

/**
 * @param {import('@azure/arm-resources').ResourceManagementClient} resourcesClient
 * */
export async function createResourceGroup(resourcesClient) {
  const name = `fpjs-dev-e2e-${v4()}`

  await resourcesClient.resourceGroups.createOrUpdate(name, {
    location: 'westus2',
  })

  return name
}

export function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * @param {string} name
 * @param {import('@azure/arm-resources').ResourceManagementClient} resourcesClient
 * */
export async function removeResourceGroup(name, resourcesClient) {
  console.info('Removing resource group', name)

  const poll = await resourcesClient.resourceGroups.beginDelete(name)

  await poll.pollUntilDone()
}

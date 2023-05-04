import invariant from 'tiny-invariant'

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
const storageContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME
const storageResourceGroup = process.env.AZURE_STORAGE_RESOURCE_GROUP
const preSharedSecret = process.env.FPJS_PRE_SHARED_SECRET ?? ''

invariant(subscriptionId, 'AZURE_SUBSCRIPTION_ID is required')
invariant(storageAccountName, 'AZURE_STORAGE_ACCOUNT_NAME is required')
invariant(storageContainerName, 'AZURE_STORAGE_CONTAINER_NAME is required')
invariant(storageResourceGroup, 'AZURE_STORAGE_RESOURCE_GROUP is required')

const config = {
  subscriptionId,
  storageAccountName,
  storageContainerName,
  storageResourceGroup,
  preSharedSecret,
} satisfies Record<string, string>

export default config

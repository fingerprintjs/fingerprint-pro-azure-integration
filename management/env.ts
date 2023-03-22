import { Logger } from '@azure/functions'

export function getEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export function gatherEnvs(logger: Logger) {
  try {
    return {
      resourceGroupName: getEnv('RESOURCE_GROUP_NAME'),
      appName: getEnv('APP_NAME'),
      subscriptionId: getEnv('AZURE_SUBSCRIPTION_ID'),
    }
  } catch (error) {
    logger.error(`Error gathering environment variables: ${error}`)

    return null
  }
}

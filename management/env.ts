import { InvocationContext } from '@azure/functions'
import { assertIsTruthy } from '../shared/assert'

export function getEnv(name: string) {
  const value = process.env[name]

  assertIsTruthy(value, `Missing environment variable: ${name}`)

  return value
}

export function gatherEnvs(logger: InvocationContext) {
  try {
    return {
      resourceGroupName: getEnv('RESOURCE_GROUP_NAME'),
      appName: getEnv('APP_NAME'),
      subscriptionId: getEnv('AZURE_SUBSCRIPTION_ID'),
      allowPrerelease: process.env.ALLOW_PRERELEASE === 'true',
    }
  } catch (error) {
    logger.error(`Error gathering environment variables: ${String(error)}`)

    return null
  }
}

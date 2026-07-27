import { describe, expect, test } from 'vitest'
import { CustomerVariables } from './CustomerVariables'
import { EnvCustomerVariables } from './EnvCustomerVariables'
import { getAgentDownloadUri, getResultUri, getStatusUri } from './selectors'
import { CustomerVariableName } from './types'

describe('customer variables selectors', () => {
  describe('from env', () => {
    const getHeaderCustomerVariables = (env: typeof process.env) =>
      new CustomerVariables([new EnvCustomerVariables(env)])

    test('with env variables', async () => {
      const env = {
        [CustomerVariableName.AgentDownloadPath]: 'greiodsfkljlds',
        [CustomerVariableName.RoutePrefix]: 'eifjdsnmzxcn',
        [CustomerVariableName.GetResultPath]: 'eiwflsdkadlsjdsa',
      }

      const customerVariables = getHeaderCustomerVariables(env)

      expect(await getAgentDownloadUri(customerVariables)).toBe('eifjdsnmzxcn/greiodsfkljlds')
      expect(await getResultUri(customerVariables)).toBe('eifjdsnmzxcn/eiwflsdkadlsjdsa')
      expect(await getStatusUri(customerVariables)).toBe('eifjdsnmzxcn/status')
    })

    test('with empty env', async () => {
      const customerVariables = getHeaderCustomerVariables({})

      expect(await getAgentDownloadUri(customerVariables)).toBe('fpjs/agent')
      expect(await getResultUri(customerVariables)).toBe('fpjs/resultId')
      expect(await getStatusUri(customerVariables)).toBe('fpjs/status')
    })
  })
})

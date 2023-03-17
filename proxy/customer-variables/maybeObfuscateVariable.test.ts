import { CustomerVariableType } from './types'
import { maybeObfuscateVariable, OBFUSCATED_VALUE } from './maybeObfuscateVariable'
import { getInMemoryCustomerVariables } from '../../test/in-memory-customer-variables'

const { variables, customerVariables } = getInMemoryCustomerVariables()

describe('maybe obfuscate variable', () => {
  it('should obfuscate pre shared secret', async () => {
    const result = await maybeObfuscateVariable(customerVariables, CustomerVariableType.PreSharedSecret)

    expect(result.value).toBe(OBFUSCATED_VALUE)
  })

  it.each([CustomerVariableType.GetResultPath, CustomerVariableType.AgentDownloadPath])(
    'should not obfuscate other variables',
    async (variable) => {
      const result = await maybeObfuscateVariable(customerVariables, variable)

      expect(result.value).toBe(variables[variable])
    },
  )
})

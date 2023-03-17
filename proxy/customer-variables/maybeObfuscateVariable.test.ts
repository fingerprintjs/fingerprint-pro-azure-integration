import { CustomerVariableType } from './types'
import { maybeObfuscateVariable, OBFUSCATED_VALUE } from './maybeObfuscateVariable'

describe('maybe obfuscate variable', () => {
  it('should obfuscate pre shared secret', async () => {
    const result = await maybeObfuscateVariable(CustomerVariableType.PreSharedSecret, 'secret')

    expect(result).toBe(OBFUSCATED_VALUE)
  })

  it.each([CustomerVariableType.GetResultPath, CustomerVariableType.AgentDownloadPath])(
    'should not obfuscate other variables',
    async (variable) => {
      const result = await maybeObfuscateVariable(variable, 'test')

      expect(result).toBe('test')
    },
  )
})

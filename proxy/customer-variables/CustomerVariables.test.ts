import { CustomerVariableProvider, CustomerVariableType } from './types'
import { CustomerVariables } from './CustomerVariables'

describe('customer variables', () => {
  const mockProvider = {
    name: 'Mock',
    getVariable: jest.fn(),
  } satisfies CustomerVariableProvider

  beforeEach(() => {
    mockProvider.getVariable.mockClear()
  })

  it('should return null if all providers throw', async () => {
    mockProvider.getVariable.mockRejectedValue(new Error('test'))

    const customerVariables = new CustomerVariables([mockProvider])

    await expect(
      customerVariables.getVariable(CustomerVariableType.PreSharedSecret).then((v) => v.value),
    ).resolves.toBeNull()
  })
})

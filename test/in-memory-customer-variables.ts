import {
  CustomerVariableProvider,
  CustomerVariablesRecord,
  CustomerVariableType,
} from '../proxy/customer-variables/types'
import { CustomerVariables } from '../proxy/customer-variables/CustomerVariables'

export function getInMemoryCustomerVariables() {
  const variables = {
    [CustomerVariableType.AgentDownloadPath]: 'download',
    [CustomerVariableType.PreSharedSecret]: 'secret',
    [CustomerVariableType.GetResultPath]: 'result',
  } satisfies CustomerVariablesRecord

  const provider: CustomerVariableProvider = {
    name: 'test provider',
    getVariable: async (variable) => variables[variable],
  }

  const customerVariables = new CustomerVariables([provider])
  return { variables, customerVariables }
}

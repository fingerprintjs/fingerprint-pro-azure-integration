import { CustomerVariableValue, CustomerVariableType } from './types'

const defaultCustomerVariables = {
  [CustomerVariableType.GetResultPath]: 'resultId',
  [CustomerVariableType.PreSharedSecret]: null,
  [CustomerVariableType.AgentDownloadPath]: 'agent',
} satisfies Readonly<Record<CustomerVariableType, CustomerVariableValue>>

export function getDefaultCustomerVariable(variable: CustomerVariableType): CustomerVariableValue {
  return defaultCustomerVariables[variable]
}

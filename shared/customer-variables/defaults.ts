import { CustomerVariableValue, CustomerVariableName } from './types.ts'

const defaultCustomerVariables = {
  [CustomerVariableName.RoutePrefix]: 'fpjs',
  [CustomerVariableName.GetResultPath]: 'resultId',
  [CustomerVariableName.PreSharedSecret]: null,
  [CustomerVariableName.AgentDownloadPath]: 'agent',
} satisfies Readonly<Record<CustomerVariableName, CustomerVariableValue>>

export function getDefaultCustomerVariable(variable: CustomerVariableName): CustomerVariableValue {
  return defaultCustomerVariables[variable]
}

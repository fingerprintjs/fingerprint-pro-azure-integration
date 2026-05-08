import { CustomerVariableName, CustomerVariableValue } from './types'

export const OBFUSCATED_VALUE = '********'

export function maybeObfuscateVariable(type: CustomerVariableName, value: CustomerVariableValue) {
  if (type === CustomerVariableName.PreSharedSecret && value) {
    return OBFUSCATED_VALUE
  }

  return value
}

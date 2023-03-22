import { CustomerVariableType, CustomerVariableValue } from './types'

export const OBFUSCATED_VALUE = '********'

export function maybeObfuscateVariable(type: CustomerVariableType, value: CustomerVariableValue) {
  if (type === CustomerVariableType.PreSharedSecret && value) {
    return OBFUSCATED_VALUE
  }

  return value
}

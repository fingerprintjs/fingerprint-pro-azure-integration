import { CustomerVariableName, CustomerVariableValue } from './types.ts'
import { isTruthy } from '../assert.ts'

export const OBFUSCATED_VALUE = '********'

export function maybeObfuscateVariable(type: CustomerVariableName, value: CustomerVariableValue) {
  if (type === CustomerVariableName.PreSharedSecret && isTruthy(value)) {
    return OBFUSCATED_VALUE
  }

  return value
}

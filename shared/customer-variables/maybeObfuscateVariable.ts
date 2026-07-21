import { CustomerVariableName, CustomerVariableValue } from './types'
import { isTruthy } from '../assert'

export const OBFUSCATED_VALUE = '********'

export function maybeObfuscateVariable(type: CustomerVariableName, value: CustomerVariableValue) {
  if (type === CustomerVariableName.PreSharedSecret && isTruthy(value)) {
    return OBFUSCATED_VALUE
  }

  return value
}

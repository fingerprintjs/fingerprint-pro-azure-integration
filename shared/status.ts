import { CustomerVariableValue } from '../proxy/customer-variables/types'

export enum StatusFormat {
  HTML = 'html',
  JSON = 'json',
}

export interface EnvVarInfo {
  envVarName: string
  value: CustomerVariableValue
  isSet: boolean
  // If null, the variable was resolved with the default value, otherwise it was resolved by the provider with the given name
  resolvedBy: string | null
}

export const STATUS_PATH = 'status'

export interface StatusInfo {
  version: string
  envInfo: EnvVarInfo[]
}

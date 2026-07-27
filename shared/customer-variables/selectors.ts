import { CustomerVariables, GetVariableResult } from './CustomerVariables.ts'
import { CustomerVariableName } from './types.ts'
import { STATUS_PATH } from '../status.ts'

export const getAgentDownloadUri = async (variables: CustomerVariables) =>
  `${await getRoutePrefix(variables)}/${await getAgentDownloadPath(variables)}`

export const getResultUri = async (variables: CustomerVariables) =>
  `${await getRoutePrefix(variables)}/${await getResultPath(variables)}`

export const getStatusUri = async (variables: CustomerVariables) => `${await getRoutePrefix(variables)}/${STATUS_PATH}`

export const getPreSharedSecret = async (variables: CustomerVariables) =>
  variables
    .getVariable(CustomerVariableName.PreSharedSecret)
    .then(extractVariable)
    .then((v) => v ?? undefined)

const extractVariable = (result: GetVariableResult) => result.value

export const getRoutePrefix = async (variables: CustomerVariables) =>
  variables
    .getVariable(CustomerVariableName.RoutePrefix)
    .then(extractVariable)
    .then((v) => v ?? '')

const getAgentDownloadPath = async (variables: CustomerVariables) =>
  variables.getVariable(CustomerVariableName.AgentDownloadPath).then(extractVariable)

const getResultPath = async (variables: CustomerVariables) =>
  variables.getVariable(CustomerVariableName.GetResultPath).then(extractVariable)

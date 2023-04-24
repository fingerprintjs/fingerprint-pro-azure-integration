import { CustomerVariables, GetVariableResult } from './CustomerVariables'
import { CustomerVariableType } from './types'
import { STATUS_PATH } from '../../shared/status'

export const getAgentDownloadUri = async (variables: CustomerVariables) =>
  `${await getRoutePrefix(variables)}/${await getAgentDownloadPath(variables)}`

export const getResultUri = async (variables: CustomerVariables) =>
  `${await getRoutePrefix(variables)}/${await getResultPath(variables)}`

export const getStatusUri = async (variables: CustomerVariables) => `${await getRoutePrefix(variables)}/${STATUS_PATH}`

const extractVariable = (result: GetVariableResult) => result.value

const getRoutePrefix = async (variables: CustomerVariables) =>
  variables.getVariable(CustomerVariableType.RoutePrefix).then(extractVariable)

const getAgentDownloadPath = async (variables: CustomerVariables) =>
  variables.getVariable(CustomerVariableType.AgentDownloadPath).then(extractVariable)

const getResultPath = async (variables: CustomerVariables) =>
  variables.getVariable(CustomerVariableType.GetResultPath).then(extractVariable)

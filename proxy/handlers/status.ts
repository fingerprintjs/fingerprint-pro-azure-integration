import { HttpRequest } from '@azure/functions'
import { CustomerVariables } from '../customer-variables/CustomerVariables'
import { maybeObfuscateVariable } from '../customer-variables/maybeObfuscateVariable'
import { CustomerVariableType } from '../customer-variables/types'
import { HttpResponseSimple } from '@azure/functions/types/http'
import { EnvVarInfo, StatusFormat, StatusInfo } from '../../shared/status'

export interface HandleStatusParams {
  httpRequest: HttpRequest
  customerVariables: CustomerVariables
}

async function getEnvInfo(customerVariables: CustomerVariables) {
  const infoArray: EnvVarInfo[] = await Promise.all(
    Object.values(CustomerVariableType).map(async (variableType) => {
      const value = await customerVariables.getVariable(variableType)

      return {
        envVarName: variableType,
        value: maybeObfuscateVariable(variableType, value.value),
        isSet: Boolean(value.value),
        resolvedBy: value.resolvedBy,
      }
    }),
  )

  return infoArray
}

function renderEnvInfo(envInfo: EnvVarInfo[]) {
  const isAlSet = envInfo.every((info) => info.isSet && info.resolvedBy)

  if (isAlSet) {
    return `
      <div>
        ✅ All environment variables are set
      </div>
    `
  }

  const children = envInfo
    .filter((info) => !info.isSet || !info.resolvedBy)
    .map(
      (info) => `
        <div class="env-info-item">
            ⚠️ <strong>${info.envVarName} </strong> is not defined${info.isSet ? ' and uses default value' : ''}
        </div>`,
    )

  return `
    <div class="env-info">
      ${children.join('')}
    </div>
  `
}

function renderHtml({ version, envInfo }: StatusInfo) {
  return `
    <html lang="en-US">
      <head>
        <title>Azure integration status</title>
        <meta charset="utf-8">
        <style>
          body, .env-info {
            display: flex;
          }
          
          .env-info {
            flex-direction: column;
          }
          
          body {
            flex-direction: column;
            align-items: center;
          }
          
          body > * {
            margin-bottom: 1em;
          }
        </style>
      </head>
      <body>
        <h1>Azure integration status</h1>
        <div>
          Lambda function version: ${version}
        </div>
        ${renderEnvInfo(envInfo)}
          <span>
            Please reach out our support via <a href="mailto:support@fingerprint.com">support@fingerprint.com</a> if you have any issues
          </span>
      </body>
    </html>
  `
}

export async function getStatusInfo(customerVariables: CustomerVariables): Promise<StatusInfo> {
  return {
    version: '__lambda_func_version__',
    envInfo: await getEnvInfo(customerVariables),
  }
}

export async function handleStatus({
  customerVariables,
  httpRequest,
}: HandleStatusParams): Promise<HttpResponseSimple> {
  const { format } = httpRequest.query

  const info = await getStatusInfo(customerVariables)

  if (format === StatusFormat.JSON) {
    return {
      status: '200',
      body: info,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  }

  return {
    status: '200',
    body: renderHtml(info).trim(),
    headers: {
      'Content-Type': 'text/html',
    },
  }
}

import { HttpRequest } from '@azure/functions'
import { CustomerVariables } from '../../shared/customer-variables/CustomerVariables'
import { maybeObfuscateVariable } from '../../shared/customer-variables/maybeObfuscateVariable'
import { CustomerVariableType } from '../../shared/customer-variables/types'
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
    })
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
        <div class='env-info-item'>
            ⚠️ <strong>${info.envVarName} </strong> is not defined${info.isSet ? ' and uses default value' : ''}
        </div>`
    )

  return `
    <div class='env-info'>
      ${children.join('')}
    </div>
  `
}

function renderHtml({ version, envInfo }: StatusInfo) {
  const styleNonce = Math.random().toString(36).substring(2, 15)

  const html = `
    <html lang='en-US'>
      <head>
        <title>Fingerprint Pro Azure integration status</title>
        <meta charset='utf-8'>
        <style nonce='${styleNonce}'>
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
        <h1>Fingerprint Pro Azure integration status</h1>
        <div>
          Fingerprint Pro Azure Function App version: ${version}
        </div>
        ${renderEnvInfo(envInfo)}
          <span>
            Please reach out our support via <a href='mailto:support@fingerprint.com'>support@fingerprint.com</a> if you have any issues
          </span>
      </body>
    </html>
  `

  return {
    html,
    styleNonce,
  }
}

export async function getStatusInfo(customerVariables: CustomerVariables): Promise<StatusInfo> {
  return {
    version: '__azure_function_version__',
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

  const { html, styleNonce } = renderHtml(info)

  return {
    status: '200',
    body: html,
    headers: {
      'Content-Type': 'text/html',
      'Content-Security-Policy': `default-src 'none'; img-src https://fingerprint.com; style-src 'nonce-${styleNonce}'`,
    },
  }
}

import { CustomerVariables } from '../../shared/customer-variables/CustomerVariables'
import { CustomerVariableType } from '../../shared/customer-variables/types'
import { EnvCustomerVariables } from '../../shared/customer-variables/EnvCustomerVariables'
import { handleStatus } from './status'
import { HttpRequest, Form, FormPart } from '@azure/functions'

const fp: FormPart = {
  value: Buffer.from(''),
}
const form: Form = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get: (_: string) => fp,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAll: (_: string) => [fp],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  has: (_: string) => true,
  length: 0,
  *[Symbol.iterator]() {},
}
const req: HttpRequest = {
  method: 'GET',
  url: 'https://fp.domain.com/fpjs/status',
  headers: {},
  query: {},
  params: {},
  user: null,
  get: (x) => x,
  parseFormBody: () => form,
}

function removeNonce(body: string): string {
  const nonceParam = " nonce='"
  const begin = body.indexOf(nonceParam)
  const end = body.indexOf("'", begin + nonceParam.length) + 1

  return body.replace(body.substring(begin, end), '')
}

describe('Handle status', () => {
  it('returns correct status info in html if all variables are set', async () => {
    const getHeaderCustomerVariables = (env: typeof process.env) =>
      new CustomerVariables([new EnvCustomerVariables(env)])
    const env = {
      [CustomerVariableType.AgentDownloadPath]: 'qwertyt',
      [CustomerVariableType.RoutePrefix]: 'dsgfkjdfs',
      [CustomerVariableType.GetResultPath]: 'fdgvdsfgfds',
      [CustomerVariableType.PreSharedSecret]: 'aadddddd',
    }
    const customerVariables = getHeaderCustomerVariables(env)

    const result = await handleStatus({
      httpRequest: req,
      customerVariables: customerVariables,
    })

    expect(removeNonce(result.body)).toMatchInlineSnapshot(`
    "
        <html lang='en-US'>
          <head>
            <title>Fingerprint Pro Azure integration status</title>
            <meta charset='utf-8'>
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
            <h1>Fingerprint Pro Azure integration status</h1>
            <div>
              Fingerprint Pro Azure Function App version: __azure_function_version__
            </div>
            
          <div>
            ✅ All environment variables are set
          </div>
        
              <span>
                Please reach out our support via <a href='mailto:support@fingerprint.com'>support@fingerprint.com</a> if you have any issues
              </span>
          </body>
        </html>
      "
    `)
  })

  it('returns correct status info in html if some variables are using default values', async () => {
    const getHeaderCustomerVariables = (env: typeof process.env) =>
      new CustomerVariables([new EnvCustomerVariables(env)])
    const customerVariables = getHeaderCustomerVariables({})

    const result = await handleStatus({
      httpRequest: req,
      customerVariables: customerVariables,
    })

    expect(removeNonce(result.body)).toMatchInlineSnapshot(`
    "
        <html lang='en-US'>
          <head>
            <title>Fingerprint Pro Azure integration status</title>
            <meta charset='utf-8'>
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
            <h1>Fingerprint Pro Azure integration status</h1>
            <div>
              Fingerprint Pro Azure Function App version: __azure_function_version__
            </div>
            
        <div class='env-info'>
          
            <div class='env-info-item'>
                ⚠️ <strong>fpjs_route_prefix </strong> is not defined and uses default value
            </div>
            <div class='env-info-item'>
                ⚠️ <strong>fpjs_get_result_path </strong> is not defined and uses default value
            </div>
            <div class='env-info-item'>
                ⚠️ <strong>fpjs_pre_shared_secret </strong> is not defined
            </div>
            <div class='env-info-item'>
                ⚠️ <strong>fpjs_agent_download_path </strong> is not defined and uses default value
            </div>
        </div>
      
              <span>
                Please reach out our support via <a href='mailto:support@fingerprint.com'>support@fingerprint.com</a> if you have any issues
              </span>
          </body>
        </html>
      "
    `)
  })
})

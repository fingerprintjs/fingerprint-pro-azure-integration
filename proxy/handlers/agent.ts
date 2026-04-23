import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { config } from '../utils/config'
import * as https from 'https'
import { filterRequestHeaders, updateResponseHeadersForAgentDownload } from '../utils/headers'
import { addTrafficMonitoringSearchParamsForProCDN } from '../utils/traffic'
import { IntegrationError } from '../errors/IntegrationError'

export interface DownloadAgentParams {
  httpRequest: HttpRequest
  logger: InvocationContext
  path: string
}

const DEFAULT_VERSION = '3'

function copySearchParams(query: URLSearchParams, newURL: URL): void {
  newURL.search = query.toString()
}

export async function downloadAgent({ httpRequest, logger, path }: DownloadAgentParams): Promise<HttpResponseInit> {
  const apiKey = httpRequest.query.get('apiKey')
  const version = httpRequest.query.get('version') ?? DEFAULT_VERSION
  const loaderVersion = httpRequest.query.get('loaderVersion')

  if (!apiKey) {
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: new IntegrationError('API Key is missing', path).toBody(),
    }
  }

  const url = new URL(`https://${config.fpcdn}`)
  copySearchParams(httpRequest.query, url)

  url.pathname = getEndpoint(apiKey, version, loaderVersion)
  addTrafficMonitoringSearchParamsForProCDN(url)

  logger.debug('Downloading agent from', url.toString())

  const headers = filterRequestHeaders(httpRequest.headers)

  delete headers['cookie']

  return new Promise<HttpResponseInit>((resolve) => {
    const data: any[] = []

    const request = https.request(
      url,
      {
        method: 'GET',
        headers,
      },
      (response) => {
        const binary = Boolean(response.headers['content-encoding'])

        response.setEncoding(binary ? 'binary' : 'utf8')

        response.on('data', (chunk) => data.push(Buffer.from(chunk, 'binary')))

        response.on('end', () => {
          const body = Buffer.concat(data)
          const responseHeaders = updateResponseHeadersForAgentDownload(response.headers)

          resolve({
            status: response.statusCode ?? 500,
            headers: responseHeaders,
            body: new Uint8Array(body),
          })
        })
      }
    )

    request.on('error', (error) => {
      logger.error('unable to download agent', { error })

      resolve({
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'error',
      })
    })

    request.end()
  })
}

function getEndpoint(apiKey: string | null, version: string, loaderVersion: string | null): string {
  const lv: string = loaderVersion ? `/loader_v${loaderVersion}.js` : ''
  return `/v${version}/${apiKey}${lv}`
}

import { HttpRequest, Logger } from '@azure/functions'
import { config } from '../utils/config'
import * as https from 'https'
import { filterRequestHeaders, updateResponseHeaders } from '../utils/headers'
import { HttpResponseSimple } from '@azure/functions/types/http'

export interface DownloadAgentParams {
  httpRequest: HttpRequest
  logger: Logger
}

export async function downloadAgent({ httpRequest, logger }: DownloadAgentParams) {
  const apiKey = httpRequest.query.apiKey
  const version = httpRequest.query.version
  const loaderVersion = httpRequest.query.loaderVersion

  const domain = new URL(httpRequest.url).hostname

  const url = new URL(`https://${config.fpdcdn}`)
  url.pathname = getEndpoint(apiKey, version, loaderVersion)

  logger.verbose('Downloading agent from', url.toString())

  const headers = filterRequestHeaders(httpRequest.headers)

  return new Promise<HttpResponseSimple>((resolve) => {
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
          const responseHeaders = updateResponseHeaders(response.headers, domain)

          resolve({
            status: response.statusCode ? response.statusCode.toString() : '500',
            headers: responseHeaders,
            body: new Uint8Array(body),
          })
        })
      },
    )

    request.on('error', (error) => {
      logger.error('unable to download agent', { error })

      resolve({
        status: '500',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'error',
      })
    })

    request.end()
  })
}

function getEndpoint(apiKey: string | undefined, version: string, loaderVersion: string | undefined): string {
  const lv: string = loaderVersion !== undefined && loaderVersion !== '' ? `/loader_v${loaderVersion}.js` : ''
  return `/v${version}/${apiKey}${lv}`
}

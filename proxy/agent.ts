import { HttpRequest } from '@azure/functions'
import { config } from './config'
import * as https from 'https'
import { updateResponseHeaders } from './headers'
import { HttpResponseSimple } from '@azure/functions/types/http'

function getEndpoint(apiKey: string | undefined, version: string, loaderVersion: string | undefined): string {
  const lv: string = loaderVersion !== undefined && loaderVersion !== '' ? `/loader_v${loaderVersion}.js` : ''
  return `/v${version}/${apiKey}${lv}`
}

export async function downloadAgent(httpRequest: HttpRequest) {
  const apiKey = httpRequest.query.apiKey
  const version = httpRequest.query.version
  const loaderVersion = httpRequest.query.loaderVersion

  const domain = new URL(httpRequest.url).hostname

  const url = new URL(`https://${config.fpdcdn}`)
  url.pathname = getEndpoint(apiKey, version, loaderVersion)

  const headers = {
    ...httpRequest.headers,
  }

  // TODO - Extract this into separate function
  delete headers['host']
  delete headers['content-length']
  delete headers['transfer-encoding']
  delete headers['via']

  return new Promise<HttpResponseSimple & { isRaw?: boolean }>((resolve) => {
    const data: any[] = []

    console.debug('Downloading agent from', url.toString())

    const request = https.request(
      url,
      {
        method: 'GET',
        // TODO Filter headers
        headers,
      },
      (response) => {
        let binary = false
        if (response.headers['content-encoding']) {
          binary = true
        }

        response.setEncoding(binary ? 'binary' : 'utf8')

        response.on('data', (chunk) => data.push(Buffer.from(chunk, 'binary')))

        response.on('end', () => {
          const body = Buffer.concat(data)

          resolve({
            status: response.statusCode ? response.statusCode.toString() : '500',
            // TODO Filter headers
            headers: updateResponseHeaders(response.headers, domain),
            body: new Uint8Array(body),
            isRaw: true,
          })
        })
      },
    )

    request.on('error', (error) => {
      console.error('unable to download agent', { error })

      resolve({
        status: '500',
        headers: {
          'Content-Type': 'application/json',
        },
        // TODO Generate error response with our integrations format
        body: error,
      })
    })

    request.end()
  })
}

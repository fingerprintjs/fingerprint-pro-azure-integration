import { HttpRequest } from '@azure/functions'
import { config } from '../utils/config'
import * as https from 'https'
import { updateResponseHeaders } from '../utils/headers'
import { HttpResponseSimple } from '@azure/functions/types/http'

export function handleIngress(httpRequest: HttpRequest) {
  const { region } = httpRequest.query

  const domain = new URL(httpRequest.url).hostname

  const url = new URL(getIngressAPIHost(region))

  Object.entries(httpRequest.query).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  console.debug('Performing request', url.toString())

  const headers = {
    ...httpRequest.headers,
  }

  delete headers['host']

  return new Promise<HttpResponseSimple & { isRaw?: boolean }>((resolve) => {
    const data: any[] = []

    const request = https.request(
      url,
      {
        method: httpRequest.method ?? 'GET',
        headers,
      },
      (response) => {
        response.on('data', (chunk) => data.push(chunk))

        response.on('end', () => {
          const payload = Buffer.concat(data)

          console.debug('Response from Ingress API', response.statusCode, payload.toString('utf-8'))

          resolve({
            status: response.statusCode ? response.statusCode.toString() : '500',
            // TODO Adjust response headers
            headers: updateResponseHeaders(response.headers, domain),
            isRaw: true,
            body: payload,
          })
        })
      },
    )

    request.on('error', (error) => {
      console.error('unable to handle result', { error })

      resolve({
        status: '500',
        headers: {},
        // TODO Generate error response with our integrations format
        body: error,
      })
    })

    request.write(httpRequest.bufferBody)

    request.end()
  })
}

function getIngressAPIHost(region: string): string {
  const prefix = region === 'us' ? '' : `${region}.`

  return `https://${prefix}${config.ingressApi}`
}

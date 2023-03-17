import { HttpRequest, Logger } from '@azure/functions'
import { config } from '../utils/config'
import * as https from 'https'
import { getHost, prepareHeadersForIngressAPI, updateResponseHeaders } from '../utils/headers'
import { HttpResponseSimple } from '@azure/functions/types/http'
import { generateErrorResponse } from '../utils/errorResponse'
import { getEffectiveTLDPlusOne } from '../domain/tld'

export interface HandleIngressParams {
  httpRequest: HttpRequest
  logger: Logger
  preSharedSecret?: string
}

export function handleIngress({ httpRequest, logger, preSharedSecret }: HandleIngressParams) {
  const { region } = httpRequest.query

  const domain = getEffectiveTLDPlusOne(getHost(httpRequest))
  const url = new URL(getIngressAPIHost(region))

  Object.entries(httpRequest.query).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  logger.verbose('Performing request', url.toString())

  if (preSharedSecret) {
    logger.verbose('Pre-shared secret is set')
  } else {
    logger.warn('Pre-shared secret is not set')
  }

  const headers = prepareHeadersForIngressAPI(httpRequest, preSharedSecret, logger)

  return new Promise<HttpResponseSimple>((resolve) => {
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

          logger.verbose('Response from Ingress API', response.statusCode, payload.toString('utf-8'))

          resolve({
            status: response.statusCode ? response.statusCode.toString() : '500',
            headers: updateResponseHeaders(response.headers, domain),
            body: payload,
          })
        })
      },
    )

    request.on('error', (error) => {
      logger.error('unable to handle result', { error })

      resolve({
        status: '500',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateErrorResponse(error)),
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

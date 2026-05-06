import { HttpRequest, HttpResponse, InvocationContext } from '@azure/functions'
import { config } from '../utils/config'
import * as https from 'https'
import { prepareHeadersForIngressAPI, updateResponseHeaders } from '../utils/headers'
import { generateErrorResponse } from '../utils/errorResponse'
import { addTrafficMonitoringSearchParamsForVisitorIdRequest } from '../utils/traffic'
import { getValidRegion, Region } from '../utils/region'

export interface HandleIngressParams {
  httpRequest: HttpRequest
  logger: InvocationContext
  preSharedSecret?: string
  suffix?: string
}

export function handleIngress({
  httpRequest,
  logger,
  preSharedSecret,
  suffix,
}: HandleIngressParams): Promise<HttpResponse> {
  if (suffix && !suffix.startsWith('/')) {
    suffix = '/' + suffix
  }

  const region = httpRequest.query.get('region') ?? Region.us

  const url = new URL(getIngressAPIHost(region) + suffix)
  url.search = httpRequest.query.toString()

  addTrafficMonitoringSearchParamsForVisitorIdRequest(url)

  logger.debug('Performing request', url.toString())

  if (preSharedSecret) {
    logger.debug('Pre-shared secret is set')
  } else {
    logger.warn('Pre-shared secret is not set')
  }

  const headers = prepareHeadersForIngressAPI(httpRequest, preSharedSecret, logger)

  // No need to send cookies for browser cache request
  if (suffix) {
    delete headers['cookie']
  }

  return new Promise<HttpResponse>((resolve) => {
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

          logger.debug('Response from Ingress API', response.statusCode, payload.toString('utf-8'))

          resolve(
            new HttpResponse({
              status: response.statusCode ? response.statusCode : 500,
              headers: updateResponseHeaders(response.headers),
              body: payload,
            })
          )
        })
      }
    )

    request.on('error', (error) => {
      logger.error('unable to handle result', { error })

      resolve(
        new HttpResponse({
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(generateErrorResponse(error)),
        })
      )
    })

    if (httpRequest.body) {
      request.write(httpRequest.body)
    }

    request.end()
  })
}

function getIngressAPIHost(region: string): string {
  const validRegion = getValidRegion(region)

  const prefix = validRegion === Region.us ? '' : `${region}.`

  return `https://${prefix}${config.ingressApi}`
}

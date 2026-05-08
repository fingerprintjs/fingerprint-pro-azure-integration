import { HttpRequest, HttpResponse, InvocationContext } from '@azure/functions'
import { config } from '../utils/config'
import * as https from 'https'
import { prepareHeadersForIngressAPI, updateResponseHeaders } from '../utils/headers'
import { generateErrorResponse } from '../utils/errorResponse'
import { addTrafficMonitoringSearchParamsForVisitorIdRequest } from '../utils/traffic'
import { getValidRegion, Region } from '../utils/region'
import { toError } from '../utils/error'
import { getV3AgentPath, INGRESS_CDN_PATH } from '../utils/paths'
import { isMethodAuthorized } from '../utils/request'

export type RequestType = 'agentV3' | 'ingressV3' | 'v4'

export interface HandleIngressParams {
  httpRequest: HttpRequest
  logger: InvocationContext
  preSharedSecret?: string
  suffix?: string
  requestType: RequestType
  behaviorPathNestLevel: number
}

export async function handleIngress({
  httpRequest,
  requestType,
  suffix,
  logger,
  preSharedSecret,
  behaviorPathNestLevel,
}: HandleIngressParams) {
  // In V4, we need to leverage the new behavior path nest level variable to figure out the path for the ingress request
  const useBehaviorPathNestLevel = requestType === 'v4'
  if (!useBehaviorPathNestLevel) {
    behaviorPathNestLevel = 0
  }

  switch (requestType) {
    // For V3 request, we need to prepend the INGRESS_CDN_PATH to the request path
    case 'agentV3':
      suffix = `${INGRESS_CDN_PATH}/${getV3AgentPath(httpRequest.query)}`
      break

    // For V4 request, we just use the path from incoming request and leverage the behavior path nest level
    case 'ingressV3':
      // For the rest, so the "ingressV3" request, we'll extract path using path matches. It's an approach that was used in the old ingress handler.
      if (suffix && !suffix.startsWith('/')) {
        suffix = '/' + suffix
      }
      break
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

  // Include cookies only for authorized methods
  if (!isMethodAuthorized(httpRequest.method)) {
    logger.debug('Removing cookie header for browser cache request')
    delete headers['cookie']
  }

  let requestBody: Buffer | undefined = undefined

  if (httpRequest.body) {
    try {
      requestBody = Buffer.from(await httpRequest.arrayBuffer())
    } catch (e) {
      logger.error('unable to handle request body', { error: e })

      return new HttpResponse({
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateErrorResponse(toError(e))),
      })
    }
  }

  return new Promise<HttpResponse>((resolve) => {
    const data: any[] = []

    const request = https.request(
      url,
      {
        method: httpRequest.method,
        headers,
      },
      (response) => {
        response.on('data', (chunk) => data.push(chunk))

        response.on('end', () => {
          logger.debug('Response from Ingress API', response.statusCode)

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

    if (requestBody) {
      request.write(requestBody)
    }

    request.end()
  })
}

export async function _handleIngress({
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
    logger.debug('Removing cookie header for browser cache request')
    delete headers['cookie']
  }

  let requestBody: Buffer | undefined = undefined

  if (httpRequest.body) {
    try {
      requestBody = Buffer.from(await httpRequest.arrayBuffer())
    } catch (e) {
      logger.error('unable to handle request body', { error: e })

      return new HttpResponse({
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateErrorResponse(toError(e))),
      })
    }
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
          logger.debug('Response from Ingress API', response.statusCode)

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

    if (requestBody) {
      request.write(requestBody)
    }

    request.end()
  })
}

function getIngressAPIHost(region: string): string {
  const validRegion = getValidRegion(region)

  const prefix = validRegion === Region.us ? '' : `${region}.`

  return `https://${prefix}${config.ingressApi}`
}

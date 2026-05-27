import { HttpRequest, InvocationContext } from '@azure/functions'
import { config } from '../utils/config'
import { prepareHeadersForIngressAPI } from '../utils/headers'
import { addTrafficMonitoringSearchParamsForIngressRequest } from '../utils/traffic'
import { getValidRegion, Region } from '../utils/region'
import { getV3AgentPath, INGRESS_CDN_PATH } from '../utils/paths'
import { isMethodAuthorized } from '../utils/request'
import { sendIngressRequest } from '../utils/transport'

export type RequestType = 'agentV3' | 'ingressV3' | 'v4'

export interface HandleIngressParams {
  httpRequest: HttpRequest
  logger: InvocationContext
  preSharedSecret?: string
  suffix?: string
  requestType: RequestType
}

export async function handleIngress({
  httpRequest,
  requestType,
  suffix,
  logger,
  preSharedSecret,
}: HandleIngressParams) {
  switch (requestType) {
    // For V3 request, we need to prepend the INGRESS_CDN_PATH to the request path
    case 'agentV3':
      suffix = `/${INGRESS_CDN_PATH}${getV3AgentPath(httpRequest.query)}`
      break

    default:
      if (suffix && !suffix.startsWith('/')) {
        suffix = '/' + suffix
      }
      break
  }

  const region = httpRequest.query.get('region') ?? Region.us

  const url = new URL(getIngressAPIHost(region))
  if (suffix) {
    url.pathname = suffix
  }
  url.search = httpRequest.query.toString()

  const isAuthorizedMethodCall = isMethodAuthorized(httpRequest.method)

  const headers = prepareHeadersForIngressAPI({
    request: httpRequest,
    isAuthorizedMethodCall: isAuthorizedMethodCall,
    preSharedSecret: preSharedSecret,
    logger: logger,
  })

  // Include cookies only for authorized methods
  if (!isAuthorizedMethodCall) {
    logger.debug('Removing cookie header for browser cache request')
    delete headers['cookie']
  } else {
    addTrafficMonitoringSearchParamsForIngressRequest(url)
  }

  logger.debug('Performing request', url.toString())

  return sendIngressRequest(httpRequest, headers, url, logger)
}

function getIngressAPIHost(region: string): string {
  const validRegion = getValidRegion(region)

  const prefix = validRegion === Region.us ? '' : `${region}.`

  return `https://${prefix}${config.ingressApi}`
}

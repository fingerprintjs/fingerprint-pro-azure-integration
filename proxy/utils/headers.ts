import * as http from 'http'
import { HttpRequest, InvocationContext } from '@azure/functions'
import { filterCookie } from './cookies.ts'
import { stripPort } from './ip.ts'
import { isTruthy } from '../../shared/assert.ts'

const AGE_HEADER_NAME = 'age'

const FPJS_COOKIE_NAME = '_iidt'

// Azure specific headers
const BLACKLISTED_HEADERS_PREFIXES = ['x-edge-', 'x-arr-', 'x-site', 'x-azure-']

const BLACKLISTED_REQUEST_HEADERS = new Set(['host', 'strict-transport-security'])
const BLACKLISTED_RESPONSE_HEADERS = new Set(['strict-transport-security', 'transfer-encoding'])
// The upstream CDN's purge tag isn't exposed for agent downloads
const CACHE_TAG_HEADER_NAME = 'cache-tag'

export function filterRequestHeaders(headers: Headers) {
  return Array.from(headers.entries()).reduce((result: { [key: string]: string }, [name, value]) => {
    const headerName = name.toLowerCase()

    if (isHeaderAllowedForRequest(headerName)) {
      let headerValue = value

      if (headerName === 'cookie') {
        headerValue = filterCookie(headerValue, (key) => key === FPJS_COOKIE_NAME)

        // Only set cookie header if there are relevant cookies
        if (headerValue) {
          result[headerName] = headerValue
        }
      } else {
        result[headerName] = headerValue
      }
    }

    return result
  }, {})
}

export const updateResponseHeadersForAgentDownload = (headers: http.IncomingHttpHeaders) =>
  updateResponseHeaders(headers, true)

export function updateResponseHeaders(
  headers: http.IncomingHttpHeaders,
  isAgentDownload = false
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(headers)) {
    if (!isHeaderAllowedForResponse(key) || !isTruthy(value)) {
      continue
    }

    if (isAgentDownload && key === CACHE_TAG_HEADER_NAME) {
      continue
    }

    result[key] = value.toString()
  }

  // Front Door replays stored responses as they are, so the agent is always served as fresh
  if (isAgentDownload) {
    result[AGE_HEADER_NAME] = '0'
  }

  return result
}

function resolveClientIp(request: HttpRequest, logger?: InvocationContext) {
  const clientIp = request.headers.get('x-azure-socketip') ?? ''

  logger?.debug('Client IP resolved', {
    clientIp,
  })

  return stripPort(clientIp)
}

export function getHost(request: Pick<HttpRequest, 'headers' | 'url'>) {
  return request.headers.get('x-forwarded-host') ?? new URL(request.url).hostname
}

interface PrepareHeadersForIngressAPIParams {
  request: HttpRequest
  isAuthorizedMethodCall: boolean
  preSharedSecret?: string
  logger?: InvocationContext
}

export function prepareHeadersForIngressAPI({
  request,
  isAuthorizedMethodCall,
  preSharedSecret,
  logger,
}: PrepareHeadersForIngressAPIParams) {
  const headers = filterRequestHeaders(request.headers)

  if (!isAuthorizedMethodCall) {
    return headers
  }

  headers['fpjs-proxy-client-ip'] = resolveClientIp(request, logger)
  const host = getHost(request)
  logger?.debug('Host resolved', host)
  headers['fpjs-proxy-forwarded-host'] = host

  if (isTruthy(preSharedSecret)) {
    headers['fpjs-proxy-secret'] = preSharedSecret
  }

  return headers
}

function isHeaderAllowedForResponse(headerName: string) {
  return !BLACKLISTED_RESPONSE_HEADERS.has(headerName) && !matchesBlacklistedHeaderPrefix(headerName)
}

function isHeaderAllowedForRequest(headerName: string) {
  return !BLACKLISTED_REQUEST_HEADERS.has(headerName) && !matchesBlacklistedHeaderPrefix(headerName)
}

function matchesBlacklistedHeaderPrefix(headerName: string) {
  return BLACKLISTED_HEADERS_PREFIXES.some((prefix) => headerName.startsWith(prefix))
}

import * as http from 'http'
import { HttpRequest, HttpRequestHeaders, HttpResponseHeaders, Logger } from '@azure/functions'
import { updateCacheControlHeader } from './cacheControl'
import { filterCookie } from './cookies'

const CACHE_CONTROL_HEADER_NAME = 'cache-control'

const FPJS_COOKIE_NAME = '_iidt'

// Azure specific headers
const BLACKLISTED_HEADERS_PREFIXES = ['x-edge-', 'x-arr-', 'x-site', 'x-azure-']

const BLACKLISTED_REQUEST_HEADERS = new Set(['host', 'strict-transport-security'])
const BLACKLISTED_RESPONSE_HEADERS = new Set(['strict-transport-security', 'transfer-encoding'])

export function filterRequestHeaders(headers: HttpRequestHeaders) {
  return Object.entries(headers).reduce((result: { [key: string]: string }, [name, value]) => {
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
  overrideCacheControl = false
): HttpResponseHeaders {
  const result: HttpResponseHeaders = {}

  for (const [key, value] of Object.entries(headers)) {
    if (!isHeaderAllowedForResponse(key) || !value) {
      continue
    }

    switch (key) {
      case CACHE_CONTROL_HEADER_NAME: {
        if (overrideCacheControl) {
          result[CACHE_CONTROL_HEADER_NAME] = updateCacheControlHeader(value.toString())
        } else {
          result[key] = value.toString()
        }

        break
      }

      default:
        result[key] = value.toString()
    }
  }

  return result
}

function resolveClientIp(request: HttpRequest, logger?: Logger) {
  const clientIp =
    request.headers['x-azure-clientip'] || request.headers['x-client-ip'] || request.headers['x-real-ip'] || ''

  logger?.verbose('Client IP resolved', {
    clientIp,
  })

  return stripPort(clientIp)
}

function stripPort(ip: string) {
  if (!ip.includes(':')) {
    return ip
  }

  return ip.split(':')[0]
}

export function getHost(request: Pick<HttpRequest, 'headers' | 'url'>) {
  return request.headers['x-forwarded-host'] || request.headers.host || new URL(request.url).hostname
}

export function prepareHeadersForIngressAPI(request: HttpRequest, preSharedSecret?: string, logger?: Logger) {
  const headers = filterRequestHeaders(request.headers)

  headers['fpjs-proxy-client-ip'] = resolveClientIp(request, logger)

  if (preSharedSecret) {
    headers['fpjs-proxy-secret'] = preSharedSecret
    headers['fpjs-proxy-forwarded-host'] = getHost(request)
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

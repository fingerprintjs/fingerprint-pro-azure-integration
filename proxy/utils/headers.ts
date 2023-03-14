import * as http from 'http'
import { HttpRequest, HttpRequestHeaders, HttpResponseHeaders } from '@azure/functions'
import { updateCacheControlHeader } from './cacheControl'
import { adjustCookies, filterCookie } from './cookies'

const COOKIE_HEADER_NAME = 'set-cookie'
const CACHE_CONTROL_HEADER_NAME = 'cache-control'
// TODO Include azure headers
const BLACKLISTED_HEADERS_PREFIXES = ['x-edge-', 'x-amz-cf-']

const READ_ONLY_REQUEST_HEADERS = new Set(['content-length', 'host', 'transfer-encoding', 'via'])
const READ_ONLY_RESPONSE_HEADERS = new Set([
  'accept-encoding',
  'content-length',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'if-unmodified-since',
  'transfer-encoding',
  'via',
])

// TODO Include azure headers
const BLACKLISTED_HEADERS = new Set([
  'connection',
  'expect',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'trailer',
  'upgrade',
  'x-accel-buffering',
  'x-accel-charset',
  'x-accel-limit-rate',
  'x-accel-redirect',
  'x-cache',
  'x-forwarded-proto',
  'x-real-ip',
  'strict-transport-security',
])

export function filterRequestHeaders(headers: HttpRequestHeaders) {
  return Object.entries(headers).reduce((result: { [key: string]: string }, [name, value]) => {
    const headerName = name.toLowerCase()

    if (isHeaderAllowedForRequest(headerName)) {
      let headerValue = value

      if (headerName === 'cookie') {
        headerValue = headerValue.split(/; */).join('; ')
        headerValue = filterCookie(headerValue, (key) => key === '_iidt')
      }

      result[headerName] = headerValue
    }

    return result
  }, {})
}

export function updateResponseHeaders(headers: http.IncomingHttpHeaders, domain: string): HttpResponseHeaders {
  const result: HttpResponseHeaders = {}

  for (const [key, value] of Object.entries(headers)) {
    if (!isHeaderAllowedForResponse(key) || !value) {
      continue
    }

    switch (key) {
      case COOKIE_HEADER_NAME: {
        result[COOKIE_HEADER_NAME] = adjustCookies(Array.isArray(value) ? value : [value], domain)

        break
      }

      case CACHE_CONTROL_HEADER_NAME: {
        result[CACHE_CONTROL_HEADER_NAME] = updateCacheControlHeader(value.toString())

        break
      }

      default:
        result[key] = value.toString()
    }
  }

  return result
}

export function getHost(request: Pick<HttpRequest, 'headers'>) {
  return request.headers['x-forwarded-host'] || request.headers.host
}

function isHeaderAllowedForResponse(headerName: string) {
  return (
    !READ_ONLY_RESPONSE_HEADERS.has(headerName) &&
    !BLACKLISTED_HEADERS.has(headerName) &&
    !matchesBlacklistedHeaderPrefix(headerName)
  )
}

function isHeaderAllowedForRequest(headerName: string) {
  return (
    !READ_ONLY_REQUEST_HEADERS.has(headerName) &&
    !BLACKLISTED_HEADERS.has(headerName) &&
    !matchesBlacklistedHeaderPrefix(headerName)
  )
}

function matchesBlacklistedHeaderPrefix(headerName: string) {
  for (const blacklistedHeaderPrefix of BLACKLISTED_HEADERS_PREFIXES) {
    if (headerName.startsWith(blacklistedHeaderPrefix)) {
      return true
    }
  }

  return false
}

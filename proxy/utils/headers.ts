import * as http from 'http'
import { HttpRequestHeaders, HttpResponseHeaders } from '@azure/functions'
import { updateCacheControlHeader } from './cacheControl'

const COOKIE_HEADER_NAME = 'set-cookie'
const CACHE_CONTROL_HEADER_NAME = 'cache-control'
const ALLOWED_RESPONSE_HEADERS = [
  'access-control-allow-credentials',
  'access-control-allow-origin',
  'access-control-expose-headers',
  'content-encoding',
  'content-type',
  'cross-origin-resource-policy',
  'etag',
  'vary',
]
const BLACKLISTED_REQUEST_HEADERS = ['content-length', 'host', 'transfer-encoding', 'via']

export function filterRequestHeaders(headers: HttpRequestHeaders) {
  return Object.entries(headers).reduce((result: { [key: string]: string }, [name, value]) => {
    const headerName = name.toLowerCase()

    if (!BLACKLISTED_REQUEST_HEADERS.includes(headerName)) {
      let headerValue = value[0]

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

  for (const name of ALLOWED_RESPONSE_HEADERS) {
    const value = headers[name]

    if (value) {
      result[name] = value.toString()
    }
  }

  if (headers[COOKIE_HEADER_NAME]) {
    result[COOKIE_HEADER_NAME] = adjustCookies(headers[COOKIE_HEADER_NAME], domain)
  }

  if (headers[CACHE_CONTROL_HEADER_NAME]) {
    result[CACHE_CONTROL_HEADER_NAME] = updateCacheControlHeader(headers[CACHE_CONTROL_HEADER_NAME])
  }

  return result
}

export function filterCookie(cookie: string, filterPredicate: (key: string) => boolean): string {
  const newCookie: string[] = []
  const parts = cookie.split(';')

  parts.forEach((it) => {
    const s = it.trim()
    const ind = s.indexOf('=')
    if (ind !== -1) {
      const key = s.substring(0, ind)
      const value = s.substring(ind + 1)
      if (filterPredicate(key)) {
        newCookie.push(`${key}=${value}`)
      }
    }
  })

  return newCookie.join('; ').trim()
}

export function adjustCookies(cookies: string[], domainName: string): string {
  const newCookies: string[] = []
  cookies.forEach((it) => {
    const parts: string[] = it.split(';')

    parts.map((v: string) => {
      const s = v.trim()
      const ind = s.indexOf('=')
      if (ind !== -1) {
        const key = s.substring(0, ind)
        let value = s.substring(ind + 1)
        if (key.toLowerCase() === 'domain') {
          value = domainName
        }
        newCookies.push(`${key}=${value}`)
      } else {
        newCookies.push(s)
      }
    })
  })

  return newCookies.join('; ').trim()
}

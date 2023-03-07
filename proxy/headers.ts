import * as http from 'http'
import { HttpResponseHeaders } from '@azure/functions/types/http'

const COOKIE_HEADER_NAME = 'set-cookie'
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

export function updateResponseHeaders(headers: http.IncomingHttpHeaders, domain: string): HttpResponseHeaders {
  const result: HttpResponseHeaders = {}

  for (const key in headers) {
    if (ALLOWED_RESPONSE_HEADERS.includes(key)) {
      const headerValue = headers[key]

      if (headerValue) {
        result[key] = Array.isArray(headerValue) ? headerValue.join(' ') : headerValue
      }
    }
  }

  if (headers[COOKIE_HEADER_NAME] !== undefined) {
    result[COOKIE_HEADER_NAME] = adjustCookies(headers[COOKIE_HEADER_NAME], domain)
  }

  return result
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

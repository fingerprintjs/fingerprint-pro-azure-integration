export function filterCookie(cookie: string, filterPredicate: (key: string) => boolean): string {
  const newCookie: string[] = []
  const parts = cookie.split(';')

  parts.forEach((cookie) => {
    const trimmedCookie = cookie.trim()
    const index = trimmedCookie.indexOf('=')

    if (index !== -1) {
      const key = trimmedCookie.substring(0, index)
      const value = trimmedCookie.substring(index + 1)
      if (filterPredicate(key)) {
        newCookie.push(`${key}=${value}`)
      }
    }
  })

  return newCookie.join('; ').trim()
}

export function adjustCookies(cookies: string[], domainName: string): string {
  const newCookies: string[] = []

  cookies.forEach((cookie) => {
    const parts: string[] = cookie.split(';')

    parts.map((rawValue: string) => {
      const trimmedValue = rawValue.trim()
      const index = trimmedValue.indexOf('=')

      if (index !== -1) {
        const key = trimmedValue.substring(0, index)
        let value = trimmedValue.substring(index + 1)
        if (key.toLowerCase() === 'domain') {
          value = domainName
        }
        newCookies.push(`${key}=${value}`)
      } else {
        newCookies.push(trimmedValue)
      }
    })
  })

  return newCookies.join('; ').trim()
}

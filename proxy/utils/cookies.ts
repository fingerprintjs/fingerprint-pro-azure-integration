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

import { isIPv4, isIPv6 } from 'net'

export function stripPort(ip: string) {
  // Check if it's an IPv6 address with a port
  if (ip.startsWith('[')) {
    // IPv6 address with port
    const closingBracketIndex = ip.indexOf(']')
    if (closingBracketIndex !== -1) {
      return ip.substring(1, closingBracketIndex)
    }
  } else {
    // IPv4 address with port or IPv6 without brackets
    const colonIndex = ip.lastIndexOf(':')
    if (colonIndex !== -1) {
      const ipWithoutPort = ip.substring(0, colonIndex)
      // Validate if the part before the colon is a valid IPv4 or IPv6 address
      if (isValidIp(ipWithoutPort)) {
        return ipWithoutPort
      }
    }
  }
  // If no port is found, return the original IP
  return ip
}

function isValidIp(ip: string) {
  return isIPv4(ip) || isIPv6(ip)
}

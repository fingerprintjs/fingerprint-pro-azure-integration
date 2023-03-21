import { compare } from 'semver'

export function isSemverGreater(left: string, right: string): boolean {
  try {
    return compare(left, right) === 1
  } catch {
    return false
  }
}

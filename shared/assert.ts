export function assertIsTruthy<T>(value: T | null | undefined | '', message?: string): asserts value is T {
  if (!isTruthy(value)) {
    throw new Error(message ?? 'Expected value to be truthy')
  }
}

export function isTruthy<T>(value: T | null | undefined | ''): value is T {
  return Boolean(value)
}

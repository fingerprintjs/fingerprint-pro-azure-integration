export function assertIsTruthy<T>(value: T | FalseValue, message?: string): asserts value is T {
  if (!isTruthy(value)) {
    throw new Error(message ?? 'Expected value to be truthy')
  }
}

export type FalseValue = false | 0 | null | undefined

export function isTruthy<T>(value: T | FalseValue): value is T {
  return Boolean(value)
}

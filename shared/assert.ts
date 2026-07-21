export function assertIsTruthy<T>(value: T | null | undefined, message?: string): asserts value is T {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!value) {
    throw new Error(message ?? 'Expected value to be truthy')
  }
}

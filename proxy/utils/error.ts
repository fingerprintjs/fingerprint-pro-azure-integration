export function toError(err: unknown) {
  return err instanceof Error ? err : new Error(String(err))
}

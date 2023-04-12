export function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const handleAbort = () => {
      clearTimeout(timeout)
      resolve()
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)

      resolve()
    }, ms)

    timeout.unref()

    signal?.addEventListener('abort', handleAbort)
  })
}

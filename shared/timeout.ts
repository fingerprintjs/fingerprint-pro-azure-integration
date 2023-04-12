import { wait } from './wait'

export function timeout(ms = 1000 * 60 * 2, signal?: AbortSignal) {
  return new Promise((resolve, reject) => {
    wait(ms, signal).then(() => {
      reject(new Error('Operation Timeout'))
    })
  })
}

export async function withTimeout<T>(callback: () => Promise<T>, ms = 1000 * 60 * 2) {
  const abortController = new AbortController()

  const result = await Promise.race([callback(), timeout(ms, abortController.signal)])

  abortController.abort()

  return result as T
}

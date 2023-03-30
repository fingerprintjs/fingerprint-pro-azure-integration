import * as fpjs from '@fingerprintjs/fingerprintjs-pro'
import { LoadOptions } from '@fingerprintjs/fingerprintjs-pro'

export type FingerprintOptions = ReturnType<typeof getOptions>

export function getOptions() {
  return {
    apiKey: import.meta.env.VITE_API_KEY as string,
    endpoint: import.meta.env.VITE_ENDPOINT as string,
    scriptUrlPattern: import.meta.env.VITE_SCRIPT_URL_PATTERN as string,
  } satisfies LoadOptions
}

export async function getVisitorData(options: LoadOptions = getOptions()) {
  const agent = await fpjs.load(options)

  return await agent.get({
    extendedResult: true,
  })
}

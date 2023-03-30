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
  const agentStart = Date.now()
  const agent = await fpjs.load(options)
  const agentEnd = Date.now()

  const responseStart = Date.now()
  const response = await agent.get({
    extendedResult: true,
  })
  const responseEnd = Date.now()
  return {
    response,
    responseLoadTime: responseEnd - responseStart,
    agentLoadTime: agentEnd - agentStart,
  }
}

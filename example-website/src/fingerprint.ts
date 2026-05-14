import * as V3 from '@fingerprintjs/fingerprintjs-pro'
import * as V4 from '@fingerprint/agent'

export type FingerprintVersion = 'v3' | 'v4'

export type FingerprintOptions = {
  apiKey: string
  integrationPath: string
  version: FingerprintVersion

  v3: {
    endpoint: string
    scriptUrlPattern: string
  }
}

function getValue(search: URLSearchParams, key: string, envKey: string) {
  return search.get(key) ?? (import.meta.env[envKey] as string)
}

function getFingerprintVersion(search: URLSearchParams): FingerprintVersion {
  const version = search.get('version')
  if (!version) {
    return 'v3'
  }
  if (version !== 'v3' && version !== 'v4') {
    throw new Error(`Invalid fingerprint version: ${version}`)
  }
  return version
}

export function getOptions(): FingerprintOptions {
  const search = new URLSearchParams(location.search)

  const integrationPath = getValue(search, 'integrationPath', 'VITE_INTEGRATION_PATH')
  return {
    apiKey: getValue(search, 'apiKey', 'VITE_API_KEY'),
    integrationPath,
    version: getFingerprintVersion(search),

    v3: {
      endpoint: `/${integrationPath}/${getValue(search, 'endpoint', 'VITE_RESULT_PATH')}`,
      scriptUrlPattern: `/${integrationPath}/${getValue(search, 'agentPath', 'VITE_AGENT_PATH')}?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>`,
    },
  }
}

async function withBenchmark<T>(callback: () => Promise<T>): Promise<[T, number]> {
  const start = Date.now()
  const result = await callback()
  const end = Date.now()

  return [result, end - start]
}

export type VisitorDataWithBenchmark = {
  response: unknown
  agentLoadTime: number
  responseLoadTime: number
}

export async function getVisitorData(options: FingerprintOptions = getOptions()): Promise<VisitorDataWithBenchmark> {
  switch (options.version) {
    case 'v3': {
      const [agent, agentLoadTime] = await withBenchmark(() =>
        V3.load({
          apiKey: options.apiKey,
          endpoint: options.v3.endpoint,
          scriptUrlPattern: options.v3.scriptUrlPattern,
        })
      )
      const [response, responseLoadTime] = await withBenchmark(() =>
        agent.get({
          extendedResult: true,
        })
      )
      return {
        response,
        agentLoadTime,
        responseLoadTime,
      }
    }

    case 'v4': {
      const endpoint = new URL(location.origin)
      endpoint.pathname = `/${options.integrationPath}/`
      const [agent, agentLoadTime] = await withBenchmark(async () =>
        V4.start({
          apiKey: options.apiKey,
          endpoints: endpoint.toString(),
        })
      )

      const [response, responseLoadTime] = await withBenchmark(async () => agent.get())

      return {
        response,
        agentLoadTime,
        responseLoadTime,
      }
    }
  }
}

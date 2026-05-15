import { execSync } from 'child_process'
import { readTestInfo } from '../shared/testInfo'
import pkg from '../../package.json'
import { ExponentialBackoff, handleAll, retry } from 'cockatiel'

async function doMockTests() {
  let hasError = false
  const testInfo = readTestInfo()

  const apiUrl = process.env.API_URL

  if (!apiUrl) {
    throw new Error('API_URL is not set')
  }

  for (const info of testInfo.tests) {
    const agentPath = `${info.routePrefix}/${info.agentDownloadPath}`
    const resultPath = `${info.routePrefix}/${info.getResultPath}`
    const host = info.frontdoorUrl

    const agentUrl = new URL(host)
    agentUrl.pathname = agentPath

    const resultUrl = new URL(host)
    resultUrl.pathname = resultPath

    const integrationUrl = new URL(host)
    integrationUrl.pathname = info.routePrefix

    console.info('Running mock server for', host)
    console.info('Agent download path:', agentPath)
    console.info('Get result path:', resultPath)

    const args = {
      'api-url': `https://${apiUrl}`,
      'integration-url': integrationUrl.toString(),
      'cdn-path': agentPath,
      'ingress-path': resultPath,
      'traffic-name': 'fingerprintjs-pro-cloudfront',
      'integration-version': pkg.version,
      'enable-new-tests': 'true',
    } as Record<string, string | string[]>

    const argsString = Object.entries(args)
      .flatMap(([key, value]) => {
        if (typeof value === 'string') {
          return `--${key}="${value}"`
        }

        return value.map((v) => `--${key}="${v}"`)
      })
      .join(' ')

    try {
      execSync(
        `npm exec -y "git+https://github.com/fingerprintjs/dx-team-mock-for-proxy-integrations-e2e-tests.git" -- ${argsString}`,
        {
          stdio: 'inherit',
        }
      )
    } catch (e) {
      console.error(e)

      hasError = true
    }
  }

  if (hasError) {
    throw new Error('One or more tests failed')
  }
}

async function main() {
  const policy = retry(handleAll, {
    backoff: new ExponentialBackoff({
      // 5 minutes
      maxDelay: 1000 * 60 * 5,
    }),
    maxAttempts: 5,
  })

  try {
    await policy.execute(doMockTests)
  } catch (e) {
    console.error(e)

    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

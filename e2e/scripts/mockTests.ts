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
    const host = info.frontdoorUrl

    const integrationUrl = new URL(host)
    integrationUrl.pathname = info.routePrefix

    console.info('Running mock server for', host)
    console.info('Integration URL', integrationUrl.toString())
    console.info('Agent download path:', info.agentDownloadPath)
    console.info('Get result path:', info.getResultPath)

    const args = {
      'api-url': `https://${apiUrl}`,
      'integration-url': integrationUrl.toString(),
      'cdn-path': info.agentDownloadPath,
      'ingress-path': info.getResultPath,
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

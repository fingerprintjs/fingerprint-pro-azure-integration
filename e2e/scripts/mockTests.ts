import { execSync } from 'child_process'
import { readTestInfo } from '../shared/testInfo.ts'
import pkg from '../../package.json' with { type: 'json' }
import { ExponentialBackoff, handleAll, retry } from 'cockatiel'
import dotenv from 'dotenv'
import { assertIsTruthy } from '../../shared/assert.ts'

dotenv.config()

function doMockTests() {
  let hasError = false
  const testInfo = readTestInfo()

  const apiUrl = process.env.API_URL

  assertIsTruthy(apiUrl, 'API_URL is not set')

  for (const info of testInfo.tests) {
    const host = info.frontdoorUrl

    const integrationUrl = new URL(host)
    integrationUrl.pathname = info.routePrefix

    const args = {
      'api-url': `https://${apiUrl}`,
      'integration-url': integrationUrl.toString(),
      'cdn-path': info.agentDownloadPath,
      'ingress-path': info.getResultPath,
      'traffic-name': 'fingerprint-pro-azure',
      'integration-version': pkg.version,
      'enable-new-tests': 'true',
    } as Record<string, string | string[]>

    console.info('Running mock tests with args:', args)

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

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})

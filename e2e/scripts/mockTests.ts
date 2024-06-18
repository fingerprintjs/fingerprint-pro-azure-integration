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

    console.info('Running mock server for', host)
    console.info('Agent download path:', agentPath)
    console.info('Get result path:', resultPath)

    try {
      execSync(
        `npm exec -y "git+https://github.com/fingerprintjs/dx-team-mock-for-proxy-integrations-e2e-tests.git" -- --api-url="https://${apiUrl}" --cdn-proxy-url="${agentUrl.toString()}" --ingress-proxy-url="${resultUrl.toString()}" --traffic-name="fingerprint-pro-azure" --integration-version=${pkg.version}`,
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

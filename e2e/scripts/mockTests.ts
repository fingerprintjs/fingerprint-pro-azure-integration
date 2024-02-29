import { execSync } from 'child_process'
import { readTestInfo } from '../shared/testInfo'
import { ExponentialBackoff, handleAll, retry } from 'cockatiel'

async function main() {
  let hasError = false
  const testInfo = readTestInfo()

  for (const info of testInfo) {
    const policy = retry(handleAll, {
      maxAttempts: 3,
      backoff: new ExponentialBackoff(),
    })

    const agentPath = `${info.routePrefix}/${info.agentDownloadPath}`
    const resultPath = `${info.routePrefix}/${info.getResultPath}`

    console.info('Running mock server for', info.frontdoorUrl)
    console.info('Agent download path:', agentPath)
    console.info('Get result path:', resultPath)

    try {
      await policy.execute(() =>
        execSync(
          `npm exec -y "git+https://github.com/fingerprintjs/mock-for-e2e.git" -- --host="${info.frontdoorUrl}" --cdn-proxy-path="${agentPath}" --ingress-proxy-path="${resultPath}"`,
          {
            stdio: 'inherit',
          },
        ),
      )
    } catch (e) {
      console.error(e)

      hasError = true
    }
  }

  if (hasError) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

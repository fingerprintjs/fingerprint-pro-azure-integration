import { execSync } from 'child_process'
import { readTestInfo } from '../shared/testInfo'

async function main() {
  let hasError = false
  const testInfo = readTestInfo()

  const apiUrl = process.env.API_URL

  if (!apiUrl) {
    throw new Error('API_URL is not set')
  }

  for (const info of testInfo) {
    const agentPath = `${info.routePrefix}/${info.agentDownloadPath}`
    const resultPath = `${info.routePrefix}/${info.getResultPath}`
    const host = info.functionAppUrl

    console.info('Running mock server for', host)
    console.info('Agent download path:', agentPath)
    console.info('Get result path:', resultPath)

    try {
      execSync(
        `npm exec -y "git+https://github.com/fingerprintjs/dx-team-mock-for-proxy-integrations-e2e-tests.git" -- --api-url="https://${apiUrl}" --host="${host}" --cdn-proxy-path="${agentPath}" --ingress-proxy-path="${resultPath}"`,
        {
          stdio: 'inherit',
        },
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

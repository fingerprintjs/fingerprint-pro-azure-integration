import { execSync } from 'child_process'
import { readTestInfo } from '../shared/testInfo'

async function main() {
  const testInfo = readTestInfo()
  for (const info of testInfo) {
    const agentPath = `${info.routePrefix}/${info.agentDownloadPath}`
    const resultPath = `${info.routePrefix}/${info.getResultPath}`

    console.info('Running mock server for', info.frontdoorUrl)
    console.info('Agent download path:', agentPath)
    console.info('Get result path:', resultPath)

    execSync(
      `npm exec -y "git+https://github.com/fingerprintjs/mock-for-e2e.git" -- --host="${info.frontdoorUrl}" --cdn-proxy-path="${agentPath}" --ingress-proxy-path="${resultPath}"`,
      {
        stdio: 'inherit',
      },
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

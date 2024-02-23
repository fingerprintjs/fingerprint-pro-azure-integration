import { execSync } from 'child_process'
import { readTestInfo } from '../shared/testInfo'

async function main() {
  const testInfo = readTestInfo()
  for (const info of testInfo) {
    execSync(
      `npm exec -y "git+https://github.com/fingerprintjs/mock-for-e2e.git" -- --host="${info.frontdoorUrl}" --cdn-proxy-path="${info.agentDownloadPath}" --ingress-proxy-path="${info.getResultPath}"`,
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

import { Config } from '@playwright/test'
import path from 'path'
import { readTestInfo } from './shared/testInfo'

const isCi = process.env.CI === 'true'

if (isCi) {
  console.info('CI environment detected')
} else {
  console.info('Local environment detected')
}

const config: Config = {
  testDir: path.resolve(__dirname, 'tests'),
  retries: isCi ? 3 : 0,
  forbidOnly: isCi,
  timeout: isCi ? 600_000 : 30_000,
  expect: {
    timeout: isCi ? 100_000 : 30_000,
  },
  projects: [
    {
      use: {
        baseURL: readTestInfo().frontdoorUrl,
        headless: true,
      },
    },
  ],
  globalSetup: path.resolve(__dirname, 'tests/setup.ts'),
}

export default config

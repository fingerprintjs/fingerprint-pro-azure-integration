import { Config } from '@playwright/test'
import path from 'path'
import { readTestInfo } from './shared/testInfo'

const isCi = process.env.CI === 'true'

const config: Config = {
  testDir: path.resolve(__dirname, 'tests'),
  retries: isCi ? 3 : 0,
  timeout: isCi ? 60_000 : 30_000,
  projects: [
    {
      use: {
        baseURL: readTestInfo().frontdoorUrl,
        headless: true,
      },
    },
  ],
  globalSetup: path.resolve(__dirname, 'tests/setup.ts'),
  globalTeardown: path.resolve(__dirname, 'tests/teardown.ts'),
}

export default config

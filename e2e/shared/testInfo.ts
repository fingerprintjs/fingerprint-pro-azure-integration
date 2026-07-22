import * as fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'node:path'

export interface TestInfo {
  functionAppUrl: string
  websiteUrl: string
  frontdoorUrl: string
  functionBlobUrl: string
  functionBlobName: string
  getResultPath: string
  agentDownloadPath: string
  routePrefix: string
}

export interface TestMetadata {
  resourceGroup: string
  tests: TestInfo[]
}

const __dirname = dirname(fileURLToPath(import.meta.url))

const filePath = path.join(__dirname, '..', 'test-info.json')

export function initTestInfo(resourceGroup: string) {
  if (fs.existsSync(filePath)) {
    throw new Error('Test info file already exists')
  }

  writeTestInfo({
    tests: [],
    resourceGroup,
  })
}

export function addTestInfo(testInfo: TestInfo) {
  const infos = readTestInfo()

  infos.tests.push(testInfo)

  writeTestInfo(infos)
}

export function writeTestInfo(info: TestMetadata) {
  fs.writeFileSync(filePath, JSON.stringify(info))
}

export function readTestInfo(): TestMetadata {
  if (!fs.existsSync(filePath)) {
    throw new Error('Test info file does not exist')
  }

  // `JSON.parse` is untyped (returns `any`), so we assert the persisted shape here.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return JSON.parse(fs.readFileSync(filePath).toString()) as TestMetadata
}

export function safeReadTestInfo(): TestMetadata | null {
  try {
    return readTestInfo()
  } catch {
    return null
  }
}

export function deleteTestInfo() {
  fs.rmSync(filePath)
}

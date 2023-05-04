import * as fs from 'fs'
import path from 'path'

export interface TestInfo {
  resourceGroup: string
  functionAppUrl: string
  websiteUrl: string
  frontdoorUrl: string
  functionBlobUrl: string
  functionBlobName: string
  getResultPath: string
  agentDownloadPath: string
  routePrefix: string
}

const filePath = path.join(__dirname, '..', 'test-info.json')

export function writeTestInfo(info: TestInfo[]) {
  fs.writeFileSync(filePath, JSON.stringify(info))
}

export function readTestInfo(): TestInfo[] {
  if (!fs.existsSync(filePath)) {
    throw new Error('Test info file does not exist')
  }

  return JSON.parse(fs.readFileSync(filePath).toString())
}

export function deleteTestInfo() {
  fs.rmSync(filePath)
}

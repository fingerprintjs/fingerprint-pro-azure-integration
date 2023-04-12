import { FingerprintOptions, getOptions } from './fingerprint'
import { handleVisitorData } from './result'
import { checkAzureStatus } from './azure'

async function main() {
  const options = getOptions()

  outputOptions(options)
  outputAzureStatus(options).catch(console.error)

  handleVisitorData(options)
}

function outputOptions(options: FingerprintOptions) {
  const target = document.querySelector('.client-configuration')

  if (!target) {
    return
  }

  target.innerHTML = `
    <h2>Configuration</h2>
    ${writeConfiguration('endpoint', options.endpoint?.toString() ?? 'default')}
    ${writeConfiguration('scriptUrlPattern', options.scriptUrlPattern?.toString() ?? 'default')}
    `
}

async function outputAzureStatus(options: FingerprintOptions) {
  const target = document.querySelector('.integration-info')

  if (!target) {
    return
  }

  try {
    const status = await checkAzureStatus(options)

    target.innerHTML = `
    <h2>Azure status</h2>
    ${writeConfiguration('version', `${status.version}`)}
    `
  } catch (error) {
    target.innerHTML = `
    <h2>Azure status</h2>
    ${writeConfiguration('status', `⚠️ Failed to obtain status. ${error}`)}
    <span>Azure integration is not running correctly, or the website is configured not properly</span>
    `
  }
}

function writeConfiguration(key: string, value: string) {
  return `
<div class='configuration'>
  <span class='name'>${key}:</span>
  <span class='value'>${value}</span>
</div>`.trim()
}

main().catch(console.error)

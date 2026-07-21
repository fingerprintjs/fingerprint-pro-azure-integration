import { FingerprintOptions, getOptions } from './fingerprint'
import { handleVisitorData } from './result'
import { checkAzureStatus } from './azure'

function main() {
  const options = getOptions()

  outputOptions(options)
  outputAzureStatus(options.integrationPath).catch(console.error)

  handleVisitorData(options)
}

function outputOptions(options: FingerprintOptions) {
  const target = document.querySelector('.client-configuration')

  if (!target) {
    return
  }

  target.innerHTML = `
    <h2>Configuration</h2>
    <pre>
${JSON.stringify(options, null, 2)}
    </pre>
    `
}

async function outputAzureStatus(integrationPath: string) {
  const target = document.querySelector('.integration-info')

  if (!target) {
    return
  }

  try {
    const status = await checkAzureStatus(integrationPath)

    target.setAttribute('data-ok', 'true')
    target.innerHTML = `
    <h2>Azure status</h2>
    ${writeConfiguration('version', status.version)}
    `
  } catch (error) {
    target.innerHTML = `
    <h2>Azure status</h2>
    ${writeConfiguration('status', `⚠️ Failed to obtain status. ${String(error)}`)}
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

main()

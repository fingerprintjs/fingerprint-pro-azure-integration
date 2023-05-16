import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const distPath = path.resolve(dirname, '../dist')
const localSettingsPath = path.resolve(dirname, '../local.settings.json')
const dest = path.join(distPath, 'local.settings.json')

try {
  if (fs.existsSync(localSettingsPath)) {
    fs.copyFileSync(localSettingsPath, dest)
  } else {
    fs.writeFileSync(
      dest,
      JSON.stringify({
        IsEncrypted: false,
        Values: {
          FUNCTIONS_WORKER_RUNTIME: 'node',
        },
      }),
    )
  }
} catch (err) {
  console.error('Failed to copy local settings', err)

  process.exit(1)
}

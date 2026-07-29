import { defineConfig, Plugin } from 'vite'
import { builtinModules } from 'node:module'
import { join } from 'node:path'
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import dotenv from 'dotenv'
import packageJson from './package.json' with { type: 'json' }
import { isTruthy } from './shared/assert.ts'
import path from 'path'
import { fileURLToPath } from 'url'
import { getLicenseBanner } from './build-utils/license.ts'

const dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config()

const outputDirectory = 'dist'
const artifactName = 'index'
const isForRelease = process.env.IS_RELEASE_BUILD === 'true'

function getEnv(key: string, defaultValue: string) {
  const value = process.env[key]
  if (isTruthy(value)) {
    return value
  }

  console.warn(`Missing environment variable "${key}". Using default value: ${defaultValue}`)
  return defaultValue
}

const env = {
  ingressApi: getEnv('INGRESS_API', 'api.fpjs.io'),
}

/**
 * Emits a tailored package.json into the artifact directory after the bundle
 * has been written.
 */
function packageJsonPlugin(): Plugin {
  return {
    name: 'create-package-json',
    writeBundle() {
      const distPackageJson = {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        main: `${artifactName}.js`,
        license: packageJson.license,
      } satisfies Record<string, unknown>

      mkdirSync(outputDirectory, { recursive: true })
      writeFileSync(join(outputDirectory, 'package.json'), JSON.stringify(distPackageJson, null, 2) + '\n', 'utf-8')
    },
  }
}

function copyLocalSettingsPlugin(): Plugin {
  return {
    name: 'copy-local-settings',
    writeBundle() {
      const localSettingsPath = path.resolve(dirname, '../local.settings.json')
      const dest = path.join(outputDirectory, 'local.settings.json')

      if (existsSync(localSettingsPath)) {
        copyFileSync(localSettingsPath, dest)
      } else {
        const defaultLocalSettings = {
          IsEncrypted: false,
          Values: {
            FUNCTIONS_WORKER_RUNTIME: 'node',
          },
        }

        writeFileSync(dest, JSON.stringify(defaultLocalSettings))
      }
    },
  }
}

function copyHost(): Plugin {
  return {
    name: 'copy-host',
    writeBundle() {
      const hostPath = path.resolve(dirname, 'host.json')
      const dest = path.join(outputDirectory, 'host.json')

      if (existsSync(hostPath)) {
        copyFileSync(hostPath, dest)
      }
    },
  }
}

// Keep Node built-ins and the host-provided `@azure/functions-core` external
// (parity with the previous build); everything else is bundled into the single file.
const builtins = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)])
function isExternal(id: string) {
  return id === '@azure/functions-core' || builtins.has(id)
}

export default defineConfig({
  define: {
    __ingress_api__: JSON.stringify(env.ingressApi),
  },
  build: {
    target: 'node24',
    outDir: outputDirectory,
    emptyOutDir: true,
    minify: false,
    sourcemap: !isForRelease,
    // SSR build → Node module resolution (no browser polyfills for built-ins).
    ssr: 'index.ts',
    rollupOptions: {
      external: isExternal,
      output: {
        format: 'cjs',
        entryFileNames: `${artifactName}.js`,
        exports: 'named',
        banner: getLicenseBanner('Azure Front Door Proxy Integration'),
        codeSplitting: false,
      },
      plugins: [packageJsonPlugin(), copyLocalSettingsPlugin(), copyHost()],
    },
  },
  // Force bundling of all npm dependencies (SSR externalizes them by default).
  ssr: {
    noExternal: true,
  },
})

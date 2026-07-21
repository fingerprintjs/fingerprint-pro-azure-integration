import { defineConfig, Plugin } from 'vite'
import { builtinModules } from 'node:module'
import { join } from 'node:path'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import dotenv from 'dotenv'
import packageJson from './package.json' with { type: 'json' }
import { isTruthy } from './shared/assert'
import path from 'path'
import { fileURLToPath } from 'url'

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
  fpcdn: getEnv('FPCDN', 'fpcdn.io'),
  ingressApi: getEnv('INGRESS_API', 'api.fpjs.io'),
}

/**
 * Replaces build-time tokens embedded as string literals in the source
 * (e.g. `'__INGRESS_API__'`). Only touches project files; returns an empty sourcemap
 * so the transform does not trigger sourcemap-loss warnings.
 */
function replaceTokensPlugin(replacements: Record<string, string>): Plugin {
  const keys = Object.keys(replacements)
  return {
    name: 'replace-tokens',
    transform(code: string, id: string) {
      if (id.includes('node_modules')) {
        return null
      }

      let changed = false
      let out = code
      for (const key of keys) {
        if (out.includes(key)) {
          out = out.split(key).join(replacements[key])
          changed = true
        }
      }

      return changed ? { code: out, map: { mappings: '' } } : null
    },
  }
}

/**
 * Prepends the license banner (from assets/license_banner.txt) to the bundle,
 * interpolating the lodash-style tokens the file uses.
 */
function buildBanner(): string {
  const raw = readFileSync(join('assets', 'license_banner.txt'), 'utf-8')
  const interpolated = raw
    .replace('<%= pkg.version %>', packageJson.version)
    .replace('<%= new Date().getFullYear() %>', String(new Date().getFullYear()))

  const body = interpolated
    .trimEnd()
    .split('\n')
    .map((line) => ` * ${line}`)
    .join('\n')
  return `/**\n${body}\n */`
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
        banner: buildBanner(),
        // Emit a single self-contained file (Rolldown's successor to
        // Rollup's deprecated `inlineDynamicImports`).
        codeSplitting: false,
      },
      plugins: [
        replaceTokensPlugin({
          __FPCDN__: env.fpcdn,
          __INGRESS_API__: env.ingressApi,
          __azure_function_version__: packageJson.version,
        }),
        packageJsonPlugin(),
        copyLocalSettingsPlugin(),
        copyHost(),
      ],
    },
  },
  // Force bundling of all npm dependencies (SSR externalizes them by default).
  ssr: {
    noExternal: true,
  },
})

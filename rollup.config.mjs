import typescript from '@rollup/plugin-typescript'
import jsonPlugin from '@rollup/plugin-json'
import licensePlugin from 'rollup-plugin-license'
import dtsPlugin from 'rollup-plugin-dts'
import replace from '@rollup/plugin-replace'
import { join } from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import dotenv from 'dotenv'
import packageJson from './package.json' with { type: 'json' }
import { mkdir, writeFile } from 'node:fs/promises'

dotenv.config()
const outputDirectory = 'dist'

function getEnv(key, defaultValue) {
  const value = process.env[key]
  if (value) {
    return value
  }

  if (defaultValue) {
    console.warn(`Missing environment variable "${key}". Using default value: ${defaultValue}`)
    return defaultValue
  }

  throw new Error(`Missing environment variable ${key}`)
}

/**
 * Custom Rollup plugin that emits a tailored package.json file
 * into the artifact directory after the bundle has been written.
 *
 * @param {string} artifactName - Name of the artifact (used as subdir in dist)
 * @returns {import('rollup').Plugin}
 */
function createPackageJsonPlugin(artifactName) {
  return {
    name: 'create-package-json',
    // `writeBundle` runs after Rollup has written the output files to disk
    async writeBundle() {
      const distPackageJson = {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        main: `${artifactName}/${artifactName}.js`,
        license: packageJson.license,
        //dependencies: packageJson.dependencies ?? {},
      }

      await mkdir(outputDirectory, { recursive: true })
      await writeFile(join(outputDirectory, 'package.json'), JSON.stringify(distPackageJson, null, 2) + '\n', 'utf-8')

      this.info(`Generated package.json in ${outputDirectory}`)
    },
  }
}

function makeConfig(opts, entryFile, artifactName) {
  const isDev = opts.watch

  const buildFlags = {
    isForRelease: !isDev && process.env.IS_RELEASE_BUILD === 'true',
  }

  if (buildFlags.isForRelease) {
    console.info('Building for release')
  }

  const commonBanner = licensePlugin({
    banner: {
      content: {
        file: join('assets', 'license_banner.txt'),
      },
    },
  })

  const env = {
    fpcdn: getEnv('FPCDN', 'fpcdn.io'),
    ingressApi: getEnv('INGRESS_API', 'api.fpjs.io'),
  }

  /**
   * @type {import('rollup').RollupOptions}
   * */
  const commonInput = {
    input: entryFile,
    external: ['https'],
    plugins: [
      jsonPlugin(),
      typescript({
        tsconfig: 'tsconfig.app.json',
      }),
      commonjs(),
      nodeResolve({ preferBuiltins: false }),
      replace({
        __FPCDN__: env.fpcdn,
        __INGRESS_API__: env.ingressApi,
        __azure_function_version__: packageJson.version,
        preventAssignment: true,
      }),
      commonBanner,
      createPackageJsonPlugin(artifactName),
    ],
  }

  /**
   * @type {import('rollup').OutputOptions}
   * */
  const commonOutput = {
    exports: 'named',
    sourcemap: !buildFlags.isForRelease,
  }

  const output = [
    {
      ...commonInput,
      output: [
        {
          ...commonOutput,
          file: `${outputDirectory}/${artifactName}/${artifactName}.js`,
          format: 'cjs',
        },
      ],
    },
  ]

  if (!buildFlags.isForRelease) {
    output.push({
      ...commonInput,
      plugins: [dtsPlugin(), commonBanner],
      output: {
        file: `${outputDirectory}/${artifactName}/${artifactName}.d.ts`,
        format: 'es',
      },
    })
  }

  return output
}

export default (opts) => {
  /**
   * @type {import('rollup').RollupOptions[]}
   * */
  return [...makeConfig(opts, 'index.ts', 'fingerprint-azure-proxy')]
}

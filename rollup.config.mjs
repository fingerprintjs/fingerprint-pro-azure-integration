import typescript from 'rollup-plugin-typescript2'
import jsonPlugin from '@rollup/plugin-json'
import licensePlugin from 'rollup-plugin-license'
import dtsPlugin from 'rollup-plugin-dts'
import replace from '@rollup/plugin-replace'
import { join } from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import copyPlugin from 'rollup-plugin-copy'
import commonjs from '@rollup/plugin-commonjs'
import dotenv from 'dotenv'
import packageJson from './package.json' assert { type: 'json' }

dotenv.config()
const outputDirectory = 'dist'

function getEnv(key, defaultValue) {
  const value = process.env[key]

  if (!value && !defaultValue) {
    throw new Error(`Missing environment variable ${key}`)
  }

  if (!value) {
    console.warn(`Missing environment variable "${key}". Using default value: ${defaultValue}`)

    return defaultValue
  }

  return value
}

function makeConfig(opts, entryFile, artifactName, functionJsonPath, transformFunctionJson) {
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
      copyPlugin({
        targets: [
          {
            src: functionJsonPath,
            dest: `${outputDirectory}/${artifactName}`,
            transform: (contents) => {
              const json = JSON.parse(contents.toString())

              if (json.disabled) {
                console.warn(
                  `Function ${artifactName} is disabled. To enable it, set "disabled" to false in ${functionJsonPath}.`,
                )
              }

              json.scriptFile = `./${artifactName}.js`

              transformFunctionJson?.(json, isDev)

              return JSON.stringify(json, null, 2)
            },
          },
        ],
      }),
      jsonPlugin(),
      typescript({
        tsconfig: 'tsconfig.app.json',
      }),
      commonjs(),
      nodeResolve({ preferBuiltins: false, exportConditions: ['node'] }),
      replace({
        __FPCDN__: env.fpcdn,
        __INGRESS_API__: env.ingressApi,
        __azure_function_version__: packageJson.version,
        preventAssignment: true,
      }),
      commonBanner,
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
  return [
    ...makeConfig(opts, 'proxy/index.ts', 'fingerprint-pro-azure-function', 'proxy/function.json'),
    ...makeConfig(
      opts,
      'management/index.ts',
      'fingerprint-pro-azure-function-management',
      'management/function.json',
      (config, isDev) => {
        if (!isDev && config.bindings[0].runOnStartup) {
          console.info(
            `Management function is configured to run on startup, but this can cause problems when deployed to Azure. Setting to false`,
          )

          config.bindings[0].runOnStartup = false
        }
      },
    ),
  ]
}

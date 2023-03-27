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

function makeConfig(opts, entryFile, artifactName, functionJsonPath, transformFunctionJson) {
  const isDev = opts.watch

  const commonBanner = licensePlugin({
    banner: {
      content: {
        file: join('assets', 'license_banner.txt'),
      },
    },
  })

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
        __FPCDN__: process.env.FPCDN,
        __INGRESS_API__: process.env.INGRESS_API,
        __lambda_func_version__: packageJson.version,
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
    sourcemap: true,
  }

  /**
   * @type {import('rollup').RollupOptions[]}
   * */
  return [
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
    {
      ...commonInput,
      plugins: [dtsPlugin(), commonBanner],
      output: {
        file: `${outputDirectory}/${artifactName}/${artifactName}.d.ts`,
        format: 'es',
      },
    },
  ]
}

export default (opts) => {
  /**
   * @type {import('rollup').RollupOptions[]}
   * */
  return [
    ...makeConfig(opts, 'proxy/index.ts', 'fingerprintjs-pro-azure-function', 'proxy/function.json'),
    ...makeConfig(
      opts,
      'management/index.ts',
      'fingerprintjs-pro-azure-function-management',
      'management/function.json',
      (config, isDev) => {
        if (isDev) {
          if (typeof config.bindings[0].runOnStartup === 'undefined') {
            console.info(
              `Running management function on startup. To disable it, set "runOnStartup" to false in management/function.json.`,
            )

            config.bindings[0].runOnStartup = true
          }
        }
      },
    ),
  ]
}

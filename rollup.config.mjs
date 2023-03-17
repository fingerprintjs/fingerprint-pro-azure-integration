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

function makeConfig(entryFile, artifactName, functionJsonPath) {
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

              json.scriptFile = `./${artifactName}.js`

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
      nodeResolve({ preferBuiltins: false, modulesOnly: true }),
      replace({
        __FPCDN__: process.env.FPCDN,
        __INGRESS_API__: process.env.INGRESS_API,
        __lambda_func_version__: packageJson.version,
        preventAssignment: true,
      }),
      commonBanner,
    ],
  }

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

/**
 * @type {import('rollup').RollupOptions[]}
 * */
const rollupConfig = [
  ...makeConfig('proxy/index.ts', 'fingerprintjs-pro-azure-function', 'proxy/function.json'),
  ...makeConfig('management/index.ts', 'fingerprintjs-pro-azure-function-management', 'management/function.json'),
]

export default rollupConfig

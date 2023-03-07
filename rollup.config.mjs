import typescript from '@rollup/plugin-typescript'
import jsonPlugin from '@rollup/plugin-json'
import licensePlugin from 'rollup-plugin-license'
import dtsPlugin from 'rollup-plugin-dts'
import replace from '@rollup/plugin-replace'
import { join } from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import dotenv from 'dotenv'
import packageJson from './package.json' assert { type: 'json' }

dotenv.config()
const outputDirectory = 'dist'

function makeConfig(
  entryFile,
  artifactName,
) {

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
      jsonPlugin(),
      typescript(),
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
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
  }

  return [
    {
      ...commonInput,
      output: [
        {
          ...commonOutput,
          file: `${outputDirectory}/${artifactName}.js`,
          format: 'cjs',
        },
      ],
    },
    {
      ...commonInput,
      plugins: [dtsPlugin(), commonBanner],
      output: {
        file: `${outputDirectory}/${artifactName}.d.ts`,
        format: 'es',
      },
    },
  ]

}


export default [
  ...makeConfig('proxy/index.ts', 'fingerprintjs-pro-azure-function'),
  ...makeConfig('management/index.ts', 'fingerprintjs-pro-azure-function-management'),
]

import { includeIgnoreFile } from 'eslint/config'
import path from 'path'
import { fileURLToPath } from 'url'
import cfg from '@fingerprintjs/eslint-config-dx-team/type-checked'
import tseslint from 'typescript-eslint'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const config = [
  includeIgnoreFile(path.resolve(__dirname, '.gitignore')),
  ...cfg,

  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
  },

  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    ...tseslint.configs.disableTypeChecked,
  },
]

export default config

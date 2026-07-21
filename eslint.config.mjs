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
    rules: {
      // Numbers and booleans interpolated into template literals are safe to use.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
    },
  },

  {
    files: ['vite.config.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.vite.json',
        tsconfigRootDir: __dirname,
      },
    },
  },

  {
    // Test and test-helper files rely heavily on mocks and type assertions,
    // where strict type-checked rules add noise without catching real bugs.
    files: ['**/*.test.{ts,tsx}', 'shared/test/**', 'e2e/scripts/mockTests.ts', 'e2e/tests/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },

  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    ...tseslint.configs.disableTypeChecked,
  },
]

export default config

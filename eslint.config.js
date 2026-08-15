import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['database/migrations/*.cjs', 'database/adapters/*.cjs', 'database/migrate.cjs', 'database/db.cjs', 'database/validate.cjs', 'main.cjs', 'preload.js', 'scripts/*.cjs'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-undef': 'error',
    },
  },
])

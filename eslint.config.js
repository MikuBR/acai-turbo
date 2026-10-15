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
    // Testes rodam em Node (vitest), não no browser: `require`, `process` e
    // outros globais de Node são legítimos aqui. Sem esta entrada o ESLint
    // acusa `require` como no-undef em security.test.js.
    // Apenas js/jsx: o projeto não tem parser de TypeScript configurado
    // (ver typescript-eslint em package.json), então arquivos .ts/.tsx são
    // ignorados pelo ESLint e validados pelo `npm run typecheck` (tsc).
    files: ['src/tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['database/migrations/*.cjs', 'database/adapters/*.cjs', 'database/migrate.cjs', 'database/db.cjs', 'database/validate.cjs', 'main.cjs', 'preload.js', 'main/*.cjs', 'scripts/*.cjs'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-undef': 'error',
    },
  },
])

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
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
  {
    files: ['src/main.jsx'],
    languageOptions: {
      globals: { marinara: 'readonly' },
    },
  },
  {
    files: ['src/controllers/rewriteExecution.js', 'src/store/useRuntimeStore.js'],
    rules: {
      'no-empty': 'off',
    },
  },
  {
    files: ['src/controllers/ledgerSessionController.js', 'src/utils/domUtils.js', 'src/utils/selectionContext.js'],
    rules: {
      'no-useless-assignment': 'off',
    },
  },
  {
    files: ['src/components/modals/AIArchitectModal.jsx', 'src/utils/domUtils.js'],
    rules: {
      'no-useless-escape': 'off',
    },
  },
  {
    files: ['src/store/usePersistentStore.js'],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^(LEGACY_BACKUP_KEY|safeLocalStorage)$' }],
    },
  },
])

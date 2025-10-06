// Note: import the internal entry to avoid resolution issues with some package versions
// Minimal base config — avoid importing @eslint/js which may not resolve in pnpm environments
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
// Avoid importing 'globals' package (pnpm/layout resolution issues). Use a minimal inline set.
const globals = {
  node: {},
  es2021: {},
  browser: {},
};

export default [
  {
    // basic recommended JavaScript parsing and environment setup
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.browser,
        fetch: 'readonly',
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Temporalmente desactivada para evitar ruido en PRs mientras incrementamos cobertura y tipamos gradualmente.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-console': ['warn', { allow: ['error', 'warn', 'log'] }],
      'no-debugger': 'error',
      'prefer-const': 'warn',
      // Downgrade no-var to warning to avoid blocking CI while legacy code exists
      'no-var': 'warn',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    ignores: [
      // ignore quarantined and backup folders to avoid parsing errors from incomplete files
      '.disabled-packages/**',
      'backups/**',
      '.econeura_backup/**',
      // temporary and legacy scripts
      'f0_*.js',
      'f1_*.js',
      'tmp-*.js',
      'node_modules/**',
      // ignore build artifacts anywhere in the repo
      'dist/**',
      '**/dist/**',
      '**/*/dist/**',
      'build/**',
      '**/build/**',
      '**/*.min.js',
      '.next/**',
      'coverage/**',
      'reports/**',
      'out/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.d.ts',
      'packages/shared/src/__auto_tests__/**',
      'packages/shared/src/__auto_tests__/*',
      'packages/shared/src/__auto_tests__/',
    ],
  },
];

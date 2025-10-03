// Minimal CommonJS ESLint config used only to provide 'ignores' patterns
// Keep this file tiny so the main ESM config (eslint.config.mjs) remains authoritative.
module.exports = [
  {
    ignores: [
      // general
      'node_modules/**',
      'dist/**',
      '**/dist/**',
      '**/*/dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      'reports/**',
      // repo-specific temporary / backups
      '.disabled-packages/**',
      'backups/**',
      '.econeura_backup/**',
      'f0_*.js',
      'f1_*.js',
      'tmp-*.js',
      'packages/shared/src/__auto_tests__/**',
      'packages/shared/src/__auto_tests__/*',
      'packages/shared/src/__auto_tests__/',
      // editor / local temp files
      '**/*.min.js',
      '**/build/**',
      '**/.vercel/**',
      '**/out/**',
      // optionally ignore generated coverage artifacts in disabled-packages
      '.disabled-packages/**/web/coverage/**',
  // ignore a few known root scripts that are not valid JS for ESLint
  'add_mock.js',
  'scripts/release/**',
    ],
  },
];

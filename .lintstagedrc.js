export default {
  // Keep pre-commit fast and non-blocking: format files locally with Prettier.
  // Full lint (eslint --max-warnings=0 + typecheck) runs in CI (see `ci-check`).
  '**/*.{ts,tsx,js,jsx}': ['prettier --write'],

  // JSON, YAML and Markdown: format with Prettier
  '**/*.json': ['prettier --write'],
  '**/*.{yml,yaml}': ['prettier --write'],
  '**/*.md': ['prettier --write'],

  // Styles and package.json: format only
  '**/*.{css,scss,sass}': ['prettier --write'],
  '**/package.json': ['prettier --write'],
};

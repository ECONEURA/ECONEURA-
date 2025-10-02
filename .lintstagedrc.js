export default {
  // TypeScript and JavaScript files: lint and format
  '**/*.{ts,tsx,js,jsx}': ['eslint --fix --max-warnings 0', 'prettier --write'],

  // JSON, YAML and Markdown: format with Prettier only (avoids external tool requirements)
  '**/*.json': ['prettier --write'],
  '**/*.{yml,yaml}': ['prettier --write'],
  '**/*.md': ['prettier --write'],

  // Styles and package.json: format only
  '**/*.{css,scss,sass}': ['prettier --write'],
  '**/package.json': ['prettier --write'],
};

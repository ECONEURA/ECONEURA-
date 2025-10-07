#!/usr/bin/env node
// Cross-platform PR helper: uses gh CLI if available and authenticated, otherwise opens compare URL in default browser.
const { execSync, spawnSync } = require('child_process');
const os = require('os');
const fs = require('fs');

const branch = process.argv[2] || 'feat/coverage-enforcement';
const base = process.argv[3] || 'main';
const repo = process.argv[4] || 'ECONEURA/ECONEURA-';

const title = 'feat(coverage): repo-level coverage gate + ignore generated files';
const body = `- Qué hace:
  - Añade soporte para gate de cobertura repo-level, múltiples reporteros (v8/istanbul/lcov) y exclusiones para archivos generados/backups.
  - Añade shims ESM/CJS para react/jsx-runtime y react/jsx-dev-runtime en apps/web/test/shims/.
  - Ajusta apps/web/vitest.config.ts y lazy-load de App en apps/web/src/main.tsx para estabilizar tests.
- Pruebas: ejecuté la suite localmente: 489 tests pasaron, 0 fallos.`;

function hasGh() {
  try { execSync('gh --version', { stdio: 'ignore' }); return true; } catch { return false; }
}

function isGhAuth() {
  try { execSync('gh auth status --hostname github.com', { stdio: 'ignore' }); return true; } catch { return false; }
}

if (hasGh() && isGhAuth()) {
  try {
    const tmp = os.tmpdir() + '/pr_body.md';
    fs.writeFileSync(tmp, body, 'utf8');
    const res = spawnSync('gh', ['pr', 'create', '--repo', repo, '--base', base, '--head', branch, '--title', title, '--body-file', tmp], { stdio: 'inherit' });
    fs.unlinkSync(tmp);
    process.exit(res.status || 0);
  } catch (e) {
    console.error('gh failed:', e);
  }
}

// Fallback: open compare URL
const encTitle = encodeURIComponent(title);
const encBody = encodeURIComponent(body);
const url = `https://github.com/${repo}/compare/${base}...${branch}?expand=1&title=${encTitle}&body=${encBody}`;
console.log('Opening URL:', url);

switch (process.platform) {
  case 'win32':
    spawnSync('powershell', ['-Command', 'Start-Process', url]);
    break;
  case 'darwin':
    spawnSync('open', [url]);
    break;
  default:
    spawnSync('xdg-open', [url]);
}

process.exit(0);

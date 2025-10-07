// scripts/ensure-local-react.js
// Comprueba que `react` y `react-dom` se resuelvan dentro del workspace
const path = require('path');
const fs = require('fs');

function check(pkg) {
  try {
    const resolved = require.resolve(pkg);
    let version = null;
    try {
      version = require(pkg).version;
    } catch {
      version = 'unknown';
    }
    const cwd = process.cwd();
    const isInsideCwd = resolved.startsWith(cwd + path.sep) || resolved.includes(path.join(cwd, 'node_modules'));
    const isPnpm = resolved.includes(path.join('.pnpm'));
    if (!isInsideCwd && !isPnpm) {
      console.error(`[ensure-local-react] ERROR: ${pkg} resolved to ${resolved} which is outside the workspace (${cwd}).`);
      return { ok: false, resolved, version };
    }
    console.log(`[ensure-local-react] OK: ${pkg} -> ${resolved} (version ${version})`);
    return { ok: true, resolved, version };
  } catch (e) {
    console.error(`[ensure-local-react] ERROR: cannot resolve ${pkg}:`, e && e.message ? e.message : e);
    return { ok: false };
  }
}

const r1 = check('react');
const r2 = check('react-dom');

if (!r1.ok || !r2.ok) process.exit(2);

// Optionally verify package.json overrides version if present
try {
  const pj = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const overrides = (pj.pnpm && pj.pnpm.overrides) || {};
  const pinnedReact = overrides.react;
  const pinnedDom = overrides['react-dom'];
  if (pinnedReact && r1.version !== pinnedReact) {
    console.warn(`[ensure-local-react] WARNING: package.json pnpm.overrides.react = ${pinnedReact} but resolved react version = ${r1.version}`);
  }
  if (pinnedDom && r2.version !== pinnedDom) {
    console.warn(`[ensure-local-react] WARNING: package.json pnpm.overrides['react-dom'] = ${pinnedDom} but resolved react-dom version = ${r2.version}`);
  }
} catch {
  // ignore
}

process.exit(0);

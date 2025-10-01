#!/usr/bin/env node
// Wrapper to reliably run the workspace typescript `tsc` binary across pnpm layouts / Windows
// Usage: node ./scripts/run-tsc.js [tsc args...]
const { spawn } = require('child_process');
const path = require('path');

function run(cmd, args, opts) {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  return new Promise((resolve, reject) => {
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error('exit ' + code))));
    p.on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  // Try to resolve typescript package main to locate its folder
  try {
    const tsMain = require.resolve('typescript');
  // typescript package root is up from its main
  const tsRoot = path.dirname(tsMain);
  // tsc location inside package (normalize in case of pnpm nested layout)
  const possible = path.resolve(tsRoot, '..', 'bin', 'tsc');
    // On pnpm, require.resolve('typescript') may already point inside node_modules/.pnpm/<pkg>/node_modules/typescript
    // Try running node <possible>
    try {
      await run(process.execPath, [possible, ...args]);
      return;
    } catch (err) {
      // fallback to direct tsc if available in PATH
      try {
        await run('tsc', args);
        return;
      } catch {
        // fallback to pnpm exec
        await run('pnpm', ['-w', 'exec', '--', 'tsc', ...args]);
        return;
      }
    }
  } catch (e) {
    // couldn't resolve typescript via require.resolve, fallback to pnpm exec
    try {
      await run('pnpm', ['-w', 'exec', '--', 'tsc', ...args]);
      return;
    } catch (err) {
      console.error('\nFailed to run tsc via require.resolve or pnpm. Please ensure typescript is installed.');
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

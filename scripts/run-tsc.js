#!/usr/bin/env node
/**
 * Run TypeScript compiler across all packages in the workspace
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get all workspace packages
const workspaceRoot = path.join(__dirname, '..');
const pnpmWorkspace = path.join(workspaceRoot, 'pnpm-workspace.yaml');

// Directories to check for tsconfig.json
const checkDirs = [
  'packages/shared',
  'packages/configs',
  'apps/web',
  'apps/cockpit',
];

let hasErrors = false;

console.log('🔍 Running TypeScript compiler across workspace...\n');

for (const dir of checkDirs) {
  const fullPath = path.join(workspaceRoot, dir);
  const tsconfigPath = path.join(fullPath, 'tsconfig.json');
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${dir} (directory not found)`);
    continue;
  }
  
  if (!fs.existsSync(tsconfigPath)) {
    console.log(`⚠️  Skipping ${dir} (no tsconfig.json)`);
    continue;
  }
  
  console.log(`📦 Checking ${dir}...`);
  
  try {
    execSync('pnpm tsc --noEmit', {
      cwd: fullPath,
      stdio: 'inherit',
      encoding: 'utf-8'
    });
    console.log(`  ✅ ${dir} - OK\n`);
  } catch (error) {
    console.log(`  ❌ ${dir} - Errors found\n`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.log('❌ TypeScript check failed');
  process.exit(1);
} else {
  console.log('✅ All TypeScript checks passed!');
  process.exit(0);
}

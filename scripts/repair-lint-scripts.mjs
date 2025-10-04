#!/usr/bin/env node
import { promises as fs } from 'fs';
import { join, relative } from 'path';

const root = process.cwd();
const globs = ['apps', 'packages'];
const backupDir = join(root, 'backups', 'package-json-backups');

async function ensureDir(path) {
  try { await fs.mkdir(path, { recursive: true }); } catch (e) {}
}

async function findPackageJsons() {
  const results = [];
  for (const g of globs) {
    const base = join(root, g);
    try {
      const entries = await fs.readdir(base, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const pj = join(base, e.name, 'package.json');
          try {
            await fs.access(pj);
            results.push(pj);
          } catch (err) {}
        }
      }
    } catch (err) {
      // folder may not exist
    }
  }
  // always include root package.json
  results.push(join(root, 'package.json'));
  return results;
}

async function hasSrc(pkgDir) {
  try {
    await fs.access(join(pkgDir, 'src'));
    return true;
  } catch (err) { return false; }
}

async function backupAndWrite(pjPath, data) {
  await ensureDir(backupDir);
  const rel = relative(root, pjPath).replace(/\\/g, '/');
  const bakPath = join(backupDir, rel.replace(/\//g, '---') + '.bak.json');
  await ensureDir(join(bakPath, '..'));
  try {
    const original = await fs.readFile(pjPath, 'utf8');
    await fs.writeFile(bakPath, original, 'utf8');
  } catch (err) {
    // ignore
  }
  await fs.writeFile(pjPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function main() {
  console.log('Scanning for package.json files...');
  const files = await findPackageJsons();
  console.log(`Found ${files.length} package.json files to inspect.`);

  for (const pj of files) {
    try {
      const raw = await fs.readFile(pj, 'utf8');
      const parsed = JSON.parse(raw);
      const pkgDir = pj.replace(/\/package.json$/, '');
      const hasSrcDir = await hasSrc(pkgDir);

      parsed.scripts = parsed.scripts || {};
      let changed = false;

      // remove obsolete --ignore-path occurrences in scripts
      for (const k of Object.keys(parsed.scripts)) {
        const v = parsed.scripts[k];
        if (typeof v === 'string' && v.includes('--ignore-path')) {
          parsed.scripts[k] = v.replace(/--ignore-path\s+\S+/g, '').replace(/\s{2,}/g, ' ').trim();
          changed = true;
        }
      }

      // ensure lint script exists
      if (!parsed.scripts.lint) {
        const defaultLint = hasSrcDir ? 'eslint "src/**" --ext .ts,.tsx,.js,.jsx --max-warnings=0' : 'eslint . --ext .ts,.tsx,.js,.jsx --max-warnings=25';
        parsed.scripts.lint = defaultLint;
        console.log(`-> Adding lint script to ${pj} (src=${hasSrcDir})`);
        changed = true;
      }

      // ensure lint:fix exists
      if (!parsed.scripts['lint:fix']) {
        parsed.scripts['lint:fix'] = parsed.scripts.lint + ' --fix';
        changed = true;
      }

      if (changed) {
        console.log(`Updating ${pj} (backing up original)`);
        await backupAndWrite(pj, parsed);
      }
    } catch (err) {
      console.error(`Failed to process ${pj}: ${err.message}`);
    }
  }
  console.log('Done. Backups placed under backups/package-json-backups/.');
}

main().catch(err => { console.error(err); process.exit(1); });

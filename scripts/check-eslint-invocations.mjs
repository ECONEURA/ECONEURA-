#!/usr/bin/env node
import { promises as fs } from 'fs';
import { join, basename } from 'path';

const repoRoot = process.cwd();
const skipDirs = ['node_modules', '.git', 'backups', 'artifacts', 'scripts', '.artifacts'];
// Files that intentionally mention .eslintignore (documentation/backups)
const skipFiles = ['LOCAL_CHANGES.md', 'backups/README.md'];
const patterns = [/--ignore-path/, /\.eslintignore\b/];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (skipDirs.includes(ent.name)) continue;
      results.push(...await walk(full));
    } else if (ent.isFile()) {
      try {
        // Skip known documentation files that intentionally reference .eslintignore
        if (skipFiles.includes(basename(full))) continue;
        const text = await fs.readFile(full, 'utf8');
        for (const p of patterns) {
          if (p.test(text)) {
            results.push({ file: full, pattern: p.source });
            break;
          }
        }
      } catch (err) {
        // ignore unreadable
      }
    }
  }
  return results;
}

(async () => {
  console.log('Scanning for problematic ESLint invocations (.eslintignore / --ignore-path)...');
  const findings = await walk(repoRoot);
  if (findings.length === 0) {
    console.log('✅ No occurrences found in scanned files (excluding backups and node_modules).');
    process.exit(0);
  }
  console.log(`⚠️ Found ${findings.length} occurrence(s):`);
  for (const f of findings) console.log(` - ${f.file}  (pattern: ${f.pattern})`);
  process.exit(2);
})();

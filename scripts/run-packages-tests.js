const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findPackageDirs(baseDirs) {
  const root = process.cwd();
  const result = [];
  for (const base of baseDirs) {
    const dir = path.join(root, base);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const pkg = path.join(dir, name);
      const pkgJson = path.join(pkg, 'package.json');
      if (fs.existsSync(pkgJson)) result.push(pkg);
    }
  }
  return result;
}

function run(cmd, args, opts = {}) {
  const commandStr = [cmd, ...args].join(' ');
  console.log('>','Running:', commandStr, 'in', opts.cwd || process.cwd());
  const r = spawnSync(commandStr, { stdio: 'inherit', shell: true, ...opts });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const err = new Error(`Command failed: ${cmd} ${args.join(' ')} (exit ${r.status})`);
    err.status = r.status;
    throw err;
  }
}

async function main() {
  // helper to ensure coverage tmp exists (robust with tiny retries)
  function ensureCovTmp() {
    const covTmp = path.join(process.cwd(), 'coverage', '.tmp');
    for (let i = 0; i < 5; i++) {
      try {
        fs.mkdirSync(covTmp, { recursive: true });
        const keep = path.join(covTmp, '.gitkeep');
        try { fs.writeFileSync(keep, ''); } catch (e) { /* ignore */ }
        return;
      } catch (err) {
        // tiny backoff
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
      }
    }
    // last attempt
    fs.mkdirSync(path.join(process.cwd(), 'coverage', '.tmp'), { recursive: true });
  }

  // If CLI args are provided, treat them as package paths to run
  const cliArgs = process.argv.slice(2);
  let packages = [];
  if (cliArgs.length > 0) {
    for (const arg of cliArgs) {
      const p = path.join(process.cwd(), arg);
      if (fs.existsSync(p)) packages.push(p);
      else console.warn('Skipped non-existing package path from CLI arg:', arg);
    }
  } else {
    packages = findPackageDirs(['apps', 'packages']);
  }
  if (packages.length === 0) {
    console.log('No packages found under apps/ or packages/. Skipping tests.');
    return;
  }

  for (const pkgPath of packages) {
    // Prefer package's test:coverage script if present, else run test
    const pkgJsonPath = path.join(pkgPath, 'package.json');
    let useScript = 'test';
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (pkgJson.scripts && pkgJson.scripts['test:coverage']) useScript = 'test:coverage';
      else if (pkgJson.scripts && pkgJson.scripts['test:ci']) useScript = 'test:ci';
      else if (pkgJson.scripts && pkgJson.scripts['test']) useScript = 'test';
    } catch (err) {
      console.warn('Could not read package.json for', pkgPath, err && err.message);
    }

    try {
      // ensure coverage tmp exists right before running each package to avoid races
      try { ensureCovTmp(); } catch (e) { /* continue anyway */ }

      // Create a per-package coverage dir to avoid multiple processes writing to same files
      const pkgName = path.basename(pkgPath).replace(/[\s\/\\]/g, '_');
      const perPkgCov = path.join(process.cwd(), 'coverage', '.tmp', pkgName);
      fs.mkdirSync(perPkgCov, { recursive: true });

      // Pass NODE_V8_COVERAGE so v8 coverage writes into package-specific dir
      const env = Object.assign({}, process.env, { NODE_V8_COVERAGE: perPkgCov });
      run('pnpm', ['-C', pkgPath, 'run', useScript], { env });
    } catch (e) {
      console.error('Tests failed for', pkgPath);
      throw e;
    }
  }

  // After all packages ran, attempt to merge any v8 fragments into coverage/ so gate can read it
  try {
    const merger = require('./merge_v8_fragments');
    if (merger && merger.runCLI) {
      merger.runCLI();
      console.log('Merged v8 fragments after package runs');
    }
  } catch (e) {
    // best-effort
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(err && err.status ? err.status : 1);
});

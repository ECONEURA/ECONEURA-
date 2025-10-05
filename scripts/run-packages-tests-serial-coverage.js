#!/usr/bin/env node
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const coverageRoot = path.join(root, 'coverage', '.tmp')

function findTargets(base) {
  const list = []
  try {
    const entries = fs.readdirSync(base, { withFileTypes: true })
    for (const e of entries) {
      if (!e.isDirectory()) continue
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue
      const pkgDir = path.join(base, e.name)
      const pj = path.join(pkgDir, 'package.json')
      if (fs.existsSync(pj)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pj, 'utf8'))
          if (pkg.scripts && (pkg.scripts['test:coverage'] || pkg.scripts.test)) {
            list.push({ name: e.name, dir: pkgDir })
          }
        } catch (e) { /* ignore */ }
      }
    }
  } catch (e) { /* ignore */ }
  return list
}

function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

ensure(coverageRoot)

const apps = findTargets(path.join(root, 'apps'))
const pkgs = findTargets(path.join(root, 'packages'))
const targets = [...apps, ...pkgs]

if (targets.length === 0) {
  console.log('No packages/apps with test:coverage found')
  process.exit(0)
}

let overallExit = 0

for (const t of targets) {
  const outDir = path.join(coverageRoot, t.name)
  ensure(outDir)
  console.log('\n=== Running coverage for', t.name, 'in', t.dir, '=>', outDir)
  const env = Object.assign({}, process.env)
  // NODE_V8_COVERAGE instructs v8 to write coverage files into this dir (per-process)
  env.NODE_V8_COVERAGE = outDir
  // run pnpm -C <dir> run test:coverage (prefer test:coverage script if present)
  const pj = require(path.join(t.dir, 'package.json'))
  const script = pj.scripts && pj.scripts['test:coverage'] ? 'test:coverage' : 'test'

  const res = spawnSync('pnpm', ['-C', t.dir, 'run', script], {
    stdio: 'inherit',
    env,
    shell: false,
  })
  if (res.status !== 0) {
    console.error(`Package ${t.name} failed with exit ${res.status}`)
    overallExit = res.status || 1
    // continue to run others to collect more artifacts
  } else {
    console.log(`Package ${t.name} OK`)
  }
}

process.exit(overallExit)

#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const targets = [
  path.join(rootDir, 'coverage', '.tmp'),
]

// also ensure coverage/.tmp exists inside each app and package so parallel test runners
// that write per-package fragments won't race with missing dirs
function collectWorkspaceDirs(base) {
  try {
    const entries = fs.readdirSync(base, { withFileTypes: true })
    for (const e of entries) {
      if (e.isDirectory()) {
        const p = path.join(base, e.name)
        // skip node_modules
        if (e.name === 'node_modules') continue
        targets.push(path.join(p, 'coverage', '.tmp'))
      }
    }
  } catch (e) {
    // ignore
  }
}

collectWorkspaceDirs(path.join(rootDir, 'apps'))
collectWorkspaceDirs(path.join(rootDir, 'packages'))

let ok = true
for (const dir of targets) {
  try {
    fs.mkdirSync(dir, { recursive: true })
    const keep = path.join(dir, '.gitkeep')
    try { fs.writeFileSync(keep, '') } catch (e) { /* ignore */ }
    console.log(`Ensured coverage tmp dir: ${dir}`)
  } catch (err) {
    console.error('Failed to ensure coverage tmp dir', dir, err)
    ok = false
  }
}
process.exit(ok ? 0 : 1)

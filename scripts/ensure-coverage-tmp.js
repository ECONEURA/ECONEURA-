#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const targets = new Set()

targets.add(path.join(rootDir, 'coverage', '.tmp'))

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
        targets.add(path.join(p, 'coverage', '.tmp'))
      }
    }
  } catch (e) {
    // ignore
  }
}

collectWorkspaceDirs(path.join(rootDir, 'apps'))
collectWorkspaceDirs(path.join(rootDir, 'packages'))

async function ensureDir(dir) {
  try {
    await fs.promises.mkdir(dir, { recursive: true })
    const keep = path.join(dir, '.gitkeep')
    try { await fs.promises.writeFile(keep, '') } catch (e) { /* ignore */ }
    // Wait briefly until dir is visible (rare race in virtualization/fs mounts)
    const maxChecks = 6
    for (let i = 0; i < maxChecks; i++) {
      try {
        await fs.promises.access(dir, fs.constants.R_OK | fs.constants.W_OK)
        console.log(`Ensured coverage tmp dir: ${dir}`)
        return true
      } catch (err) {
        // sleep 50ms
        await new Promise(r => setTimeout(r, 50))
      }
    }
    console.error('Dir created but not accessible after retries:', dir)
    return false
  } catch (err) {
    console.error('Failed to ensure coverage tmp dir', dir, err)
    return false
  }
}

(async function main() {
  const list = Array.from(targets).sort()
  let ok = true
  for (const dir of list) {
    const res = await ensureDir(dir)
    if (!res) ok = false
  }
  process.exit(ok ? 0 : 1)
})()

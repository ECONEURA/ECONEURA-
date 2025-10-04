#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const dir = path.resolve(__dirname, '..', 'coverage', '.tmp')
try {
  fs.mkdirSync(dir, { recursive: true })
  // keep a placeholder so the folder is visible in some contexts
  const keep = path.join(dir, '.gitkeep')
  try { fs.writeFileSync(keep, '') } catch (e) { /* ignore */ }
  console.log(`Ensured coverage tmp dir: ${dir}`)
  process.exit(0)
} catch (err) {
  console.error('Failed to ensure coverage tmp dir', err)
  process.exit(1)
}

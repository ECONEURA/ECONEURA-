#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function usage() {
  console.error('Usage: node coverage_report.js <coverage-final.json> <pkg-name>')
  process.exit(2)
}

if (process.argv.length < 4) usage()

const covPath = process.argv[2]
const pkg = process.argv[3]

if (!fs.existsSync(covPath)) {
  console.error('coverage file not found:', covPath)
  process.exit(2)
}

const raw = fs.readFileSync(covPath, 'utf-8')
let obj
try { obj = JSON.parse(raw) } catch (e) { void e; console.error('invalid json in', covPath); process.exit(2) }

const rows = []
for (const key of Object.keys(obj)) {
  const info = obj[key]
  const stmMap = info.statementMap || {}
  const s = info.s || {}
  const total = Object.keys(stmMap).length
  const covered = Object.keys(stmMap).reduce((acc, k) => acc + (s[k] > 0 ? 1 : 0), 0)
  const pct = total === 0 ? 100 : (covered / total) * 100

  // collect uncovered line ranges
  const uncovered = []
  for (const k of Object.keys(stmMap)) {
    if (!s[k] || s[k] === 0) {
      const seg = stmMap[k]
      if (seg && seg.start && seg.end) {
        if (seg.start.line === seg.end.line) uncovered.push(`${seg.start.line}`)
        else uncovered.push(`${seg.start.line}-${seg.end.line}`)
      }
    }
  }

  rows.push({ file: info.path || key, total, covered, pct: Math.round(pct * 100) / 100, uncovered })
}

rows.sort((a,b) => a.pct - b.pct)

const outDir = path.resolve(__dirname, '..', '.artifacts')
try { fs.mkdirSync(outDir, { recursive: true }) } catch(e){ void e }
const outPath = path.join(outDir, `COVERAGE_DETAILS_${pkg}.txt`)

const lines = []
lines.push(`# Coverage details for ${pkg}`)
lines.push('')
lines.push('| File | % Stmts | Covered / Total | Uncovered lines |')
lines.push('| ---- | -------:| ---------------:| ---------------- |')
for (const r of rows) {
  lines.push(`| ${path.relative(process.cwd(), r.file)} | ${r.pct.toFixed(2)} | ${r.covered}/${r.total} | ${r.uncovered.join(', ') || '-'} |`)
}

fs.writeFileSync(outPath, lines.join('\n'))
console.log('Wrote', outPath)
process.exit(0)

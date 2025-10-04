#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Merge per-package coverage outputs into a single coverage/coverage-summary.json
// Strategy:
// - Look for istanbul-style summaries under <pkg>/coverage/coverage-summary.json
// - Fallback to parsing <pkg>/coverage/coverage-final.json (istanbul raw) and compute totals
// - Ignore raw v8 fragments (coverage/.tmp/*.json) because converting them reliably requires
//   external deps; instead rely on per-package istanbul outputs when available.

function findPackageCoverageDirs() {
  const root = process.cwd();
  const cols = [];
  const candidates = ['apps', 'packages'];
  for (const base of candidates) {
    const d = path.join(root, base);
    if (!fs.existsSync(d)) continue;
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      if (!fs.existsSync(path.join(p, 'package.json'))) continue;
      const cov = path.join(p, 'coverage');
      if (fs.existsSync(cov)) cols.push(cov);
    }
  }
  return cols;
}

function safeReadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

function mergeSummaryObjects(sumTotal, otherTotal) {
  // otherTotal is { statements: { total, covered }, functions: {...}, branches: {...}, lines: {...} }
  const metrics = ['statements', 'functions', 'branches', 'lines'];
  for (const m of metrics) {
    const oth = otherTotal[m];
    if (!oth) continue;
    if (!sumTotal[m]) sumTotal[m] = { total: 0, covered: 0 };
    const toAddTotal = typeof oth.total === 'number' ? oth.total : (typeof oth.total === 'string' ? parseInt(oth.total,10) : 0);
    const toAddCovered = typeof oth.covered === 'number' ? oth.covered : (typeof oth.covered === 'string' ? parseInt(oth.covered,10) : 0);
    sumTotal[m].total += toAddTotal;
    sumTotal[m].covered += toAddCovered;
  }
}

function summaryFromCoverageFinal(obj) {
  // obj is coverage-final.json: per-file objects with s (statements), f (functions), b (branches)
  const tot = { statements: { total: 0, covered: 0 }, functions: { total: 0, covered: 0 }, branches: { total: 0, covered: 0 }, lines: { total: 0, covered: 0 } };
  for (const file of Object.keys(obj)) {
    const entry = obj[file];
    // statements
    if (entry.s && typeof entry.s === 'object') {
      const keys = Object.keys(entry.s);
      tot.statements.total += keys.length;
      for (const k of keys) if (entry.s[k] && entry.s[k] > 0) tot.statements.covered++;
    }
    // functions
    if (entry.f && typeof entry.f === 'object') {
      const keys = Object.keys(entry.f);
      tot.functions.total += keys.length;
      for (const k of keys) if (entry.f[k] && entry.f[k] > 0) tot.functions.covered++;
    }
    // branches
    if (entry.b && typeof entry.b === 'object') {
      const keys = Object.keys(entry.b);
      for (const k of keys) {
        const arr = entry.b[k] || [];
        tot.branches.total += arr.length;
        for (const v of arr) if (v && v > 0) tot.branches.covered++;
      }
    }
    // lines: if present as l map or fallback to statements
    if (entry.l && typeof entry.l === 'object') {
      const keys = Object.keys(entry.l);
      tot.lines.total += keys.length;
      for (const k of keys) if (entry.l[k] && entry.l[k] > 0) tot.lines.covered++;
    } else {
      // fallback: count statements as lines proxy
      // don't double count if l existed
      if (entry.s && typeof entry.s === 'object') {
        const keys = Object.keys(entry.s);
        tot.lines.total += keys.length;
        for (const k of keys) if (entry.s[k] && entry.s[k] > 0) tot.lines.covered++;
      }
    }
  }
  return tot;
}

function pct(covered, total) {
  if (!total || total === 0) return null;
  return (covered / total) * 100;
}

function buildCoverageSummary(totalCounts) {
  const res = { total: {} };
  const metrics = ['statements', 'lines', 'branches', 'functions'];
  for (const m of metrics) {
    const t = totalCounts[m] || { total: 0, covered: 0 };
    const p = pct(t.covered, t.total);
    res.total[m] = {
      total: t.total,
      covered: t.covered,
      skipped: 0,
      pct: p == null ? 0 : Number(p.toFixed(2))
    };
  }
  return res;
}

function writeSummary(summary) {
  const outDir = path.resolve('coverage');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'coverage-summary.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

function main() {
  const covDirs = findPackageCoverageDirs();
  if (covDirs.length === 0) {
    console.warn('No per-package coverage directories found under apps/ or packages/.');
  }

  const totalCounts = {};

  for (const covDir of covDirs) {
    // Prefer coverage-summary.json
    const summaryPath = path.join(covDir, 'coverage-summary.json');
    const finalPath = path.join(covDir, 'coverage-final.json');
    if (fs.existsSync(summaryPath)) {
      const obj = safeReadJson(summaryPath);
      if (obj && obj.total) {
        const t = obj.total;
        const mapped = {};
        if (t.statements) mapped.statements = { total: t.statements.total || 0, covered: t.statements.covered || 0 };
        if (t.functions) mapped.functions = { total: t.functions.total || 0, covered: t.functions.covered || 0 };
        if (t.branches) mapped.branches = { total: t.branches.total || 0, covered: t.branches.covered || 0 };
        if (t.lines) mapped.lines = { total: t.lines.total || 0, covered: t.lines.covered || 0 };
        mergeSummaryObjects(totalCounts, mapped);
        console.log('Merged summary from', summaryPath);
        continue;
      }
    }
    if (fs.existsSync(finalPath)) {
      const obj = safeReadJson(finalPath);
      if (obj) {
        const summed = summaryFromCoverageFinal(obj);
        mergeSummaryObjects(totalCounts, summed);
        console.log('Computed summary from', finalPath);
        continue;
      }
    }
    // otherwise try to use lcov if present
    const lcovPath = path.join(covDir, 'lcov.info');
    if (fs.existsSync(lcovPath)) {
      // skip: coverage-gate can parse top-level lcov; we won't parse per-package lcov here
      console.log('Found lcov at', lcovPath, 'skipping per-package lcov parsing (defer to coverage-gate).');
    }
  }

  const summary = buildCoverageSummary(totalCounts);
  writeSummary(summary);
}

if (require.main === module) {
  try {
    main();
    process.exit(0);
  } catch (e) {
    console.error('merge_v8_fragments failed:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

module.exports = { runCLI: main };

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Coverage gate utility
// - prefers coverage/coverage-summary.json (v8/istanbul style)
// - fallback to coverage/lcov.info and attempts to compute requested metric
// Usage: node scripts/coverage-gate.js --threshold 95 --metric statements

function readCoverageSummary() {
  const p = path.resolve('coverage', 'coverage-summary.json');
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      console.error('Failed parsing coverage-summary.json:', e.message);
    }
  }
  return null;
}

function parseLcov(lcovPath) {
  if (!fs.existsSync(lcovPath)) return null;
  const content = fs.readFileSync(lcovPath, 'utf8');
  const files = content.split(/end_of_record\s*/i);
  let totals = { LF: 0, LH: 0, BRF: 0, BRH: 0, FNF: 0, FNH: 0 };
  for (const block of files) {
    if (!block || !block.trim()) continue;
    const lines = block.split('\n');
    let lf = 0, lh = 0, brf = 0, brh = 0, fnf = 0, fnh = 0;
    for (const l of lines) {
      const t = l.trim();
      if (t.startsWith('LF:')) lf += parseInt(t.slice(3), 10) || 0;
      else if (t.startsWith('LH:')) lh += parseInt(t.slice(3), 10) || 0;
      else if (t.startsWith('BRF:')) brf += parseInt(t.slice(4), 10) || 0;
      else if (t.startsWith('BRH:')) brh += parseInt(t.slice(4), 10) || 0;
      else if (t.startsWith('FNF:')) fnf += parseInt(t.slice(4), 10) || 0;
      else if (t.startsWith('FNH:')) fnh += parseInt(t.slice(4), 10) || 0;
    }
    totals.LF += lf;
    totals.LH += lh;
    totals.BRF += brf;
    totals.BRH += brh;
    totals.FNF += fnf;
    totals.FNH += fnh;
  }
  return totals;
}

function getMetricFromSummary(summary, metric) {
  const total = summary.total || summary['total'] || summary['All files'] || summary['all files'];
  if (!total) return null;
  const keyMap = {
    statements: ['statements', 'stmts'],
    lines: ['lines'],
    branches: ['branches'],
    functions: ['functions', 'funcs']
  };
  const possible = keyMap[metric] || keyMap.statements;
  for (const k of possible) {
    if (total[k] && typeof total[k].pct === 'number') return total[k].pct;
  }
  return null;
}

function writeResult(result) {
  try {
    const dir = path.resolve('coverage');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'coverage-gate-result.json');
    fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf8');
  } catch (e) {
    console.warn('Could not write coverage-gate-result.json:', e.message);
  }
}

function main() {
  const argv = process.argv.slice(2);
  let threshold = 95;
  let metric = 'statements';
  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === '--threshold' || argv[i] === '-t') && argv[i+1]) {
      threshold = parseFloat(argv[i+1]);
    }
    if ((argv[i] === '--metric' || argv[i] === '-m') && argv[i+1]) {
      metric = argv[i+1];
    }
  }

  let percent = null;
  let source = null;
  const summary = readCoverageSummary();
  if (summary) {
    const got = getMetricFromSummary(summary, metric);
    if (got != null) {
      percent = got;
      source = 'coverage-summary.json';
      console.log(`Coverage (${metric}) from coverage-summary.json: ${percent}%`);
    }
  }

  if (percent == null) {
    const lcov = path.resolve('coverage', 'lcov.info');
    const alt = path.resolve('coverage', 'lcov', 'lcov.info');
    const lcovPath = fs.existsSync(lcov) ? lcov : (fs.existsSync(alt) ? alt : null);
    if (lcovPath) {
      const totals = parseLcov(lcovPath);
      if (totals) {
        // Map metric to totals, fallbacks
        if (metric === 'lines' || metric === 'statements') {
          if (totals.LF > 0) {
            percent = (totals.LH / totals.LF) * 100;
            source = 'lcov.info (lines)';
            console.log(`Coverage (approx ${metric}) from lcov.info: ${percent.toFixed(2)}%`);
          }
        } else if (metric === 'branches') {
          if (totals.BRF > 0) {
            percent = (totals.BRH / totals.BRF) * 100;
            source = 'lcov.info (branches)';
            console.log(`Coverage (approx branches) from lcov.info: ${percent.toFixed(2)}%`);
          }
        } else if (metric === 'functions') {
          if (totals.FNF > 0) {
            percent = (totals.FNH / totals.FNF) * 100;
            source = 'lcov.info (functions)';
            console.log(`Coverage (approx functions) from lcov.info: ${percent.toFixed(2)}%`);
          }
        }
      }
    }
  }

  const result = {
    metric,
    threshold,
    percent: percent == null ? null : Number(percent.toFixed(2)),
    source: source || null,
    passed: percent != null ? (percent >= threshold) : false
  };

  writeResult(result);

  if (percent == null) {
    console.error('No coverage information found (coverage/coverage-summary.json or coverage/lcov.info).');
    console.error('Wrote coverage/coverage-gate-result.json with null percent.');
    process.exit(1);
  }

  if (percent < threshold) {
    console.error(`Coverage gate failed: ${percent.toFixed(2)}% < ${threshold}%`);
    process.exit(2);
  }

  console.log(`Coverage gate passed: ${percent.toFixed(2)}% >= ${threshold}%`);
  process.exit(0);
}

main();

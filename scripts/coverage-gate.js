#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

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

function parseLcovForStatements(lcovPath) {
  if (!fs.existsSync(lcovPath)) return null;
  const content = fs.readFileSync(lcovPath, 'utf8');
  // We will approximate statements % by reading the 'LF:' and 'LH:' counts per file
  let totalLines = 0, coveredLines = 0;
  const files = content.split('end_of_record');
  for (const block of files) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    let lf = 0, lh = 0;
    for (const l of lines) {
      if (l.startsWith('LF:')) lf = parseInt(l.slice(3), 10) || 0;
      if (l.startsWith('LH:')) lh = parseInt(l.slice(3), 10) || 0;
    }
    totalLines += lf;
    coveredLines += lh;
  }
  if (totalLines === 0) return null;
  return (coveredLines / totalLines) * 100;
}

function getStatementsPercentFromSummary(summary) {
  // summary has keys per file and a 'total' key
  const total = summary.total || summary['All files'] || summary['all files'];
  if (!total) return null;
  if (total.statements && typeof total.statements.pct === 'number') return total.statements.pct;
  // older format
  if (total.stmts && typeof total.stmts.pct === 'number') return total.stmts.pct;
  return null;
}

function main() {
  const argv = process.argv.slice(2);
  let threshold = 95;
  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === '--threshold' || argv[i] === '-t') && argv[i+1]) {
      threshold = parseFloat(argv[i+1]);
    }
  }

  let percent = null;
  const summary = readCoverageSummary();
  if (summary) {
    percent = getStatementsPercentFromSummary(summary);
    if (percent != null) console.log('Coverage (statements) from coverage-summary.json:', percent + '%');
  }

  if (percent == null) {
    const lcov = path.resolve('coverage', 'lcov.info');
    const alt = path.resolve('coverage', 'lcov', 'lcov.info');
    const lcovPath = fs.existsSync(lcov) ? lcov : (fs.existsSync(alt) ? alt : null);
    if (lcovPath) {
      const approx = parseLcovForStatements(lcovPath);
      if (approx != null) {
        percent = approx;
        console.log('Coverage (approx lines) from lcov.info:', percent.toFixed(2) + '%');
      }
    }
  }

  if (percent == null) {
    console.error('No coverage information found (coverage/coverage-summary.json or coverage/lcov.info).');
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

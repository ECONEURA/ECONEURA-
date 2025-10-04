const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeCoverageSummary(pct) {
  const dir = path.resolve('coverage');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const summary = {
    total: {
      lines: { total: 100, covered: Math.round(pct), pct },
      statements: { total: 100, covered: Math.round(pct), pct },
      branches: { total: 0, covered: 0, pct: 100 },
      functions: { total: 0, covered: 0, pct: 100 }
    }
  };
  fs.writeFileSync(path.join(dir, 'coverage-summary.json'), JSON.stringify(summary), 'utf8');
}

function cleanup() {
  try { fs.rmSync(path.resolve('coverage'), { recursive: true, force: true }); } catch(e) {}
}

try {
  cleanup();
  writeCoverageSummary(96);
  execSync('node scripts/coverage-gate.js --threshold 95 --metric statements', { stdio: 'inherit' });
  console.log('PASS: gate passed as expected');
  cleanup();
  writeCoverageSummary(90);
  try {
    execSync('node scripts/coverage-gate.js --threshold 95 --metric statements', { stdio: 'inherit' });
    console.error('FAIL: expected non-zero exit for low coverage');
    process.exit(2);
  } catch (e) {
    console.log('PASS: gate failed as expected for low coverage');
    cleanup();
    process.exit(0);
  }
} catch (e) {
  console.error('Test failed', e);
  cleanup();
  process.exit(1);
}

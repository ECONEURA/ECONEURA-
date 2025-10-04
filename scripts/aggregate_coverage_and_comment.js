const fs = require('fs');
const path = require('path');
const https = require('https');

function findFiles(dir, name) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...findFiles(p, name));
    } else if (e.isFile() && e.name === name) {
      results.push(p);
    }
  }
  return results;
}

function parseIstanbul(jsonPath) {
  try {
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let total = { lines: 0, covered: 0, statements: 0, coveredStatements: 0 };
    for (const key of Object.keys(content)) {
      const entry = content[key];
      if (entry && entry.lines) {
        total.lines += entry.lines.total || 0;
        total.covered += entry.lines.covered || 0;
      }
      if (entry && entry.statements) {
        total.statements += entry.statements.total || 0;
        total.coveredStatements += entry.statements.covered || 0;
      }
    }
    return total;
  } catch (err) {
    return null;
  }
}

function parseLcov(lcovPath) {
  const content = fs.readFileSync(lcovPath, 'utf8');
  const lines = content.split(/\r?\n/);
  let fileLines = 0, fileHits = 0;
  let totalLines = 0, totalHits = 0;
  for (const l of lines) {
    if (l.startsWith('LF:')) fileLines = parseInt(l.split(':')[1]||'0',10);
    if (l.startsWith('LH:')) fileHits = parseInt(l.split(':')[1]||'0',10);
    if (l === 'end_of_record') {
      totalLines += fileLines;
      totalHits += fileHits;
      fileLines = fileHits = 0;
    }
  }
  return { lines: totalLines, covered: totalHits };
}

function aggregateCoverage() {
  const cwd = process.cwd();
  const istanbulFiles = findFiles(cwd, 'coverage-final.json');
  const lcovFiles = findFiles(cwd, 'lcov.info');
  let total = { lines: 0, covered: 0, statements: 0, coveredStatements: 0 };

  for (const f of istanbulFiles) {
    const p = parseIstanbul(f);
    if (p) {
      total.lines += p.lines;
      total.covered += p.covered;
      total.statements += p.statements;
      total.coveredStatements += p.coveredStatements;
    }
  }

  for (const f of lcovFiles) {
    const p = parseLcov(f);
    if (p) {
      total.lines += p.lines;
      total.covered += p.covered;
    }
  }

  // prefer statements if available
  const denom = total.statements || total.lines;
  const num = total.coveredStatements || total.covered;
  const pct = denom ? (num / denom) * 100 : 0;
  return { total, pct, denom, num };
}

function commentOnPR(markdown) {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!eventPath || !token || !repo) {
    console.log('CI info missing, printing summary:');
    console.log(markdown);
    return Promise.resolve(null);
  }
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const prNumber = (event.pull_request && event.pull_request.number) || (event.issue && event.issue.number);
  if (!prNumber) {
    console.log('No PR number found in event; printing summary');
    console.log(markdown);
    return Promise.resolve(null);
  }

  const [owner, repoName] = repo.split('/');
  const postData = JSON.stringify({ body: markdown });
  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: `/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
    method: 'POST',
    headers: {
      'User-Agent': 'coverage-aggregator',
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Comment posted to PR');
          resolve(JSON.parse(data));
        } else {
          console.error('Failed to post comment', res.statusCode, data);
          reject(new Error('Comment failed'));
        }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function main() {
  const result = aggregateCoverage();
  const threshold = parseFloat(process.env.COVERAGE_THRESHOLD || '80');
  const ok = result.pct >= threshold;
  const md = `## Coverage Report\n\n- Aggregate coverage: ${result.pct.toFixed(2)}%\n- Threshold: ${threshold}%\n\n`;
  console.log(md);
  try {
    await commentOnPR(md + '\n_This comment was generated automatically._');
  } catch (err) {
    console.error('Could not post comment:', err.message);
  }
  if (!ok) {
    console.error(`Coverage ${result.pct.toFixed(2)}% is below threshold ${threshold}%`);
    process.exit(2);
  }
  console.log('Coverage check passed');
  process.exit(0);
}

main();

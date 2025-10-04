const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

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

// Exclude common generated/backup paths from coverage aggregation
const EXCLUDE_PATTERNS = [
  'node_modules',
  `${path.sep}dist${path.sep}`,
  `${path.sep}build${path.sep}`,
  '.generated',
  '.backup',
  `${path.sep}.cache${path.sep}`
];

function isExcluded(p) {
  const normalized = p.replace(/\\/g, '/');
  for (const pat of EXCLUDE_PATTERNS) {
    const normPat = pat.replace(/\\/g, '/');
    if (normalized.indexOf(normPat) !== -1) return true;
  }
  return false;
}

function parseIstanbul(jsonPath) {
  try {
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    // coverage-final.json can come in different shapes (nyc/istanbul, c8/v8)
    let total = { lines: 0, covered: 0, statements: 0, coveredStatements: 0 };
    for (const key of Object.keys(content)) {
      const entry = content[key];
      if (!entry) continue;
      // c8/v8 format: entry.s is map of statement id -> hit count
      if (entry.s && typeof entry.s === 'object') {
        const stmKeys = Object.keys(entry.s);
        total.statements += stmKeys.length;
        for (const k of stmKeys) {
          const hits = Number(entry.s[k] || 0);
          if (hits > 0) total.coveredStatements += 1;
        }
      }
      // functions
      if (entry.f && typeof entry.f === 'object') {
        const fnKeys = Object.keys(entry.f);
        // not used in percent calc now, but keep for completeness
      }
      // nyc/istanbul-like: entry.lines or entry.statements may have totals
      if (entry.lines && typeof entry.lines === 'object') {
        total.lines += entry.lines.total || 0;
        total.covered += entry.lines.covered || 0;
      }
      if (entry.statements && typeof entry.statements === 'object') {
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
  const artifactsRoot = path.join(cwd, 'artifacts', 'coverage');
  const searchRoot = fs.existsSync(artifactsRoot) ? artifactsRoot : cwd;
  const istanbulFilesRaw = findFiles(searchRoot, 'coverage-final.json');
  const lcovFilesRaw = findFiles(searchRoot, 'lcov.info');
  const istanbulFiles = istanbulFilesRaw.filter(p => !isExcluded(p));
  const lcovFiles = lcovFilesRaw.filter(p => !isExcluded(p));
  const DEBUG = !!process.env.COVERAGE_DEBUG;
  if (DEBUG) {
    console.log('Coverage aggregator debug: searchRoot=', searchRoot);
    console.log('Found istanbul coverage-final.json (raw):', istanbulFilesRaw);
    console.log('Filtered istanbul files:', istanbulFiles);
    console.log('Found lcov.info (raw):', lcovFilesRaw);
    console.log('Filtered lcov files:', lcovFiles);
    console.log('Exclude patterns:', EXCLUDE_PATTERNS);
  }
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
  const foundAny = istanbulFiles.length + lcovFiles.length > 0;
  return { total, pct, denom, num, foundAny, istanbulFiles };
}

function getChangedLinesAgainstMain() {
  try {
    // Determine remote default branch (origin/HEAD -> origin/main or origin/master)
    let defaultBranch = 'main';
    try {
      const ref = execSync('git rev-parse --abbrev-ref origin/HEAD', { encoding: 'utf8' }).trim();
      if (ref && ref.startsWith('origin/')) defaultBranch = ref.replace('origin/', '');
    } catch (e) {
      // ignore, we'll try sensible defaults below
    }

    // try to fetch a bit more history for the default branch (silently)
    try {
      execSync(`git fetch origin ${defaultBranch} --no-tags --prune --depth=50`, { stdio: 'ignore' });
    } catch (e) {
      // best-effort fetch, ignore failures
    }

    // confirm there's a merge-base between origin/defaultBranch and HEAD
    let mergeBase = null;
    try {
      mergeBase = execSync(`git merge-base origin/${defaultBranch} HEAD`, { encoding: 'utf8' }).trim();
    } catch (e) {
      // merge-base calculation failed; try the other common default
      if (defaultBranch === 'main') {
        try {
          execSync('git fetch origin master --no-tags --prune --depth=50', { stdio: 'ignore' });
          mergeBase = execSync('git merge-base origin/master HEAD', { encoding: 'utf8' }).trim();
          defaultBranch = 'master';
        } catch (ee) {
          mergeBase = null;
        }
      }
    }

    if (!mergeBase) {
      // no common ancestor found (shallow clone or unrelated history)
      return null;
    }

    // now safe to run diff against the resolved remote branch
    const diff = execSync(`git diff --no-color --unified=0 origin/${defaultBranch}...HEAD`, { encoding: 'utf8' });
    // parse diff hunks like @@ -a,b +c,d @@
    const files = {};
    const lines = diff.split(/\r?\n/);
    let currentFile = null;
    for (const l of lines) {
      if (l.startsWith('+++ b/')) {
        currentFile = l.replace('+++ b/', '').trim();
        if (!files[currentFile]) files[currentFile] = new Set();
      }
      const m = l.match(/@@ .* \+(\d+)(?:,(\d+))? /);
      if (m && currentFile) {
        const start = parseInt(m[1], 10);
        const count = m[2] ? parseInt(m[2], 10) : 1;
        for (let i = start; i < start + count; i++) files[currentFile].add(i);
      }
    }
    // convert sets to arrays
    const out = {};
    for (const f of Object.keys(files)) out[f] = Array.from(files[f]);
    return out;
  } catch (err) {
    // swallow git-specific errors and return null so caller can fallback cleanly
    return null;
  }
}

function computeDiffCoverageFromIstanbul(istanbulFiles, changedLinesMap) {
  let totalChangedStatements = 0;
  let coveredChangedStatements = 0;
  for (const fPath of istanbulFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(fPath, 'utf8'));
      for (const src of Object.keys(content)) {
        const rel = path.relative(process.cwd(), content[src].path || src).replace(/\\/g, '/');
        if (isExcluded(rel)) {
          if (process.env.COVERAGE_DEBUG) console.log('Skipping excluded file in diff:', rel);
          continue; // ignore generated/backup files
        }
        const changed = changedLinesMap[rel] || changedLinesMap[content[src].path] || null;
        if (!changed) continue;
        const sMap = content[src].statementMap || {};
        const sHits = content[src].s || {};
        for (const sid of Object.keys(sMap)) {
          const st = sMap[sid];
          const stmtLine = st.start && st.start.line;
          if (!stmtLine) continue;
          if (changed.indexOf(stmtLine) !== -1) {
            totalChangedStatements += 1;
            const hits = Number(sHits[sid] || 0);
            if (hits > 0) coveredChangedStatements += 1;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return { totalChangedStatements, coveredChangedStatements };
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

  // If running in diff mode (PR) prefer to evaluate coverage only on changed lines
  const mode = process.env.COVERAGE_MODE || '';
  let ok = true;
  let md = '';
  if (mode === 'diff') {
    const changed = getChangedLinesAgainstMain();
    if (!changed) {
      md = 'Could not compute diff against main; falling back to aggregate.\n\n';
      if (process.env.COVERAGE_DEBUG) {
        console.error('Diff computation failed: getChangedLinesAgainstMain returned null.\n' +
          'Ensure checkout has full refs or inspect git fetch in workflow.');
      }
    } else {
      const diffRes = computeDiffCoverageFromIstanbul(result.istanbulFiles, changed);
      const pct = diffRes.totalChangedStatements ? (diffRes.coveredChangedStatements / diffRes.totalChangedStatements) * 100 : 100;
      ok = pct >= threshold;
      md += `## Coverage (diff) Report\n\n- Changed statements covered: ${pct.toFixed(2)}%\n- Threshold: ${threshold}%\n- Changed statements: ${diffRes.totalChangedStatements}\n\n`;
      try { await commentOnPR(md + '\n_This comment was generated automatically (diff mode)._'); } catch (err) { console.error('Could not post comment', err.message); }
      if (!ok) { console.error(`Diff coverage ${pct.toFixed(2)}% < ${threshold}%`); process.exit(2); }
      console.log('Diff coverage passed'); process.exit(0);
    }
  }

  // fallback: aggregate
  ok = result.foundAny ? (result.pct >= threshold) : true;
  md = `## Coverage Report\n\n- Aggregate coverage: ${result.pct.toFixed(2)}%\n- Threshold: ${threshold}%\n- Reports found: ${result.foundAny ? 'yes' : 'no'}\n\n`;
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

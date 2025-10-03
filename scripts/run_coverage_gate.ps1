$ErrorActionPreference = 'Stop'
chcp 65001 > $null

# 0) Validación y deps resilientes
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8').replace(/^\uFEFF/,''))"
(pnpm -w install --prefer-frozen-lockfile) -or (pnpm -w install && pnpm -w install --lockfile-only)

# 1) Descubrir targets con script test:coverage
$Pkgs = @('packages/shared','apps/web','apps/cockpit') | Where-Object { Test-Path "$_/package.json" } | ForEach-Object {
  $j = Get-Content "$_/package.json" -Raw | ConvertFrom-Json
  if ($j.scripts.'test:coverage') { $_ }
}
if (-not $Pkgs) { $Pkgs = @('packages/shared') }

# ensure artifacts dir
if (-not (Test-Path ".artifacts")) { New-Item -ItemType Directory -Path .artifacts | Out-Null }

# 2) Ejecutar coverage con timeout por paquete
$timeouts = 120
foreach ($p in $Pkgs) {
  Write-Host "→ coverage $p"
  & pnpm -w --filter $p run test:coverage
  $exit = $LASTEXITCODE
  if ($exit -ne 0) { throw "Tests failed in $p (exit $exit)" }
}

# 3) Agregar y aplicar gate peor-caso (≥90 stm, ≥80 func)
function Pct([double]$n, [double]$d) { if ($d -gt 0) { [math]::Round(100.0 * $n / $d, 2) } }
$minS = [double](${env:COV_STMTS_MIN} + '0'); if (-not $minS) { $minS = 90 }
$minF = [double](${env:COV_FUNCS_MIN} + '0'); if (-not $minF) { $minF = 80 }
$worstS = $null; $worstF = $null; $report = @()

foreach ($p in $Pkgs) {
  $sum = "${p}/coverage/coverage-summary.json"
  $fin = "${p}/coverage/coverage-final.json"
  $stm = $null; $fun = $null
  if (Test-Path $sum) {
    $t = (Get-Content $sum -Raw | ConvertFrom-Json).total
    $stm = [double]$t.statements.pct; $fun = [double]$t.functions.pct
  } elseif (Test-Path $fin) {
    $j = Get-Content $fin -Raw | ConvertFrom-Json
    $ts = 0.0; $tc = 0.0; $fs = 0.0; $fc = 0.0

    function ToNumber($x) {
      if ($null -eq $x) { return 0.0 }
      # If array, prefer count for maps, or try first element
      if ($x -is [System.Array]) { return [double]$x.Count }
      # PSObject wrapper: try unwrap
      if ($x -is [System.Management.Automation.PSObject]) { $x = $x.BaseObject }
      # Numeric or string convertible
      try {
        return [double]$x
      } catch {
        # fallback: if it's an object with Properties (like a map), count them
        try {
          if ($x -and $x.PSObject.Properties.Count -gt 0) { return [double]$x.PSObject.Properties.Count }
        } catch { }
        return 0.0
      }
    }

    foreach ($m in $j.PSObject.Properties.Value) {
      # If this entry uses istanbul-style totals (statements/functions objects), use them
      if ($m -and $m.PSObject.Properties.Match('statements').Count -gt 0) {
        $ts += ToNumber($m.statements.total)
        $tc += ToNumber($m.statements.covered)
      }
      elseif ($m -and $m.PSObject.Properties.Match('statementMap').Count -gt 0) {
        # v8 coverage-final.json shape: statementMap and s map of hits
        $stmCount = $m.statementMap.PSObject.Properties.Count
        $hitCount = 0
        foreach ($prop in $m.s.PSObject.Properties) {
          try { $val = $prop.Value; if ($val -is [System.Array]) { $val = $val[0] }; if ([double]::TryParse([string]$val,[ref]$null)) { if ([double]$val -gt 0) { $hitCount += 1 } } }
          catch { try { if ([double]$prop.Value -gt 0) { $hitCount += 1 } } catch { } }
        }
        if ($stmCount -is [System.Array]) { $stmCount = $stmCount.Count }
        $ts += ToNumber($stmCount)
        $tc += ToNumber($hitCount)
      }
      else {
        # fallback: try to sum numeric scalar fields if present
        if ($m.PSObject.Properties.Match('s').Count -gt 0) {
          $ts += ToNumber($m.s)
        }
        if ($m.PSObject.Properties.Match('f').Count -gt 0) {
          $tc += ToNumber($m.f)
        }
      }

      if ($m -and $m.PSObject.Properties.Match('functions').Count -gt 0) {
        $fs += ToNumber($m.functions.total)
        $fc += ToNumber($m.functions.covered)
      }
      elseif ($m -and $m.PSObject.Properties.Match('fnMap').Count -gt 0) {
        # v8 fnMap/f mapping: number of functions and number of functions with hits
        $fnCount = $m.fnMap.PSObject.Properties.Count
        $fnHit = 0
        foreach ($prop in $m.f.PSObject.Properties) {
          try { $val = $prop.Value; if ($val -is [System.Array]) { $val = $val[0] }; if ([double]::TryParse([string]$val,[ref]$null)) { if ([double]$val -gt 0) { $fnHit += 1 } } }
          catch { try { if ([double]$prop.Value -gt 0) { $fnHit += 1 } } catch { } }
        }
        if ($fnCount -is [System.Array]) { $fnCount = $fnCount.Count }
        $fs += ToNumber($fnCount)
        $fc += ToNumber($fnHit)
      }
      else {
        if ($m.PSObject.Properties.Match('fn').Count -gt 0) {
          $fs += ToNumber($m.fn)
        }
        if ($m.PSObject.Properties.Match('fh').Count -gt 0) {
          $fc += ToNumber($m.fh)
        }
        if ($m.PSObject.Properties.Match('fnh').Count -gt 0) {
          $fc += ToNumber($m.fnh)
        }
      }
    }
    $stm = Pct $tc $ts; $fun = Pct $fc $fs
  }
  $report += "pkg=$p stm=" + ($(if ($stm -ne $null) { $stm } else { '—' })) + " fun=" + ($(if ($fun -ne $null) { $fun } else { '—' }))
  if ($stm -ne $null) { if ($worstS -eq $null -or $stm -lt $worstS) { $worstS = $stm } }
  if ($fun -ne $null) { if ($worstF -eq $null -or $fun -lt $worstF) { $worstF = $fun } }
}

$gate = if ($worstS -ne $null -and $worstF -ne $null -and $worstS -ge $minS -and $worstF -ge $minF) { 'PASS' } else { 'FAIL' }

"Targets: " + ($Pkgs -join ", ") + "`nWorst: stmts=$worstS funcs=$worstF Gate(≥$minS/≥$minF): $gate`n" + ($report -join "`n") | Set-Content -Encoding UTF8 .artifacts\STATUS_COV_DIFF.txt

if (Test-Path ".github/workflows/ci.yml") {
  (Get-Content .github/workflows/ci.yml) -replace 'STRICT:\s*"\d+"','STRICT: "1"' | Set-Content -Encoding UTF8 .github/workflows/ci.yml
}

try {
  # Try normal add first
  git add .artifacts/STATUS_COV_DIFF.txt .github/workflows/ci.yml -A 2>$null | Out-Null
} catch {
  # If add failed, check if the artifact is ignored and force-add only that file
  $isIgnored = (& git check-ignore .artifacts/STATUS_COV_DIFF.txt 2>$null).Trim()
  if ($isIgnored) {
    try { git add -f .artifacts/STATUS_COV_DIFF.txt 2>$null | Out-Null } catch { Write-Host "warning: could not force-add artifact" }
  } else {
    Write-Host "warning: git add failed"; }
}

# Commit if there are staged changes
$status = git status --porcelain 2>$null
if ($status) {
  try {
    git commit -m "ci: coverage run + worst-case gate + STRICT=1" 2>$null | Out-Null
    git push 2>$null | Out-Null
  } catch {
    Write-Host "warning: git commit/push failed, continuing (this won't change gate result)"
  }
} else {
  Write-Host "No git changes to commit (artifacts ignored or unchanged)"
}

Write-Host "DONE → $gate | stm=$worstS fun=$worstF"
if ($gate -ne 'PASS') { exit 1 }

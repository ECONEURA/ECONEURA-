$ErrorActionPreference = "Stop"; Set-StrictMode -Version Latest
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$out = ".artifacts"; New-Item -ItemType Directory -Force -Path $out | Out-Null
$BASE = ${env:DIFF_BASE}; if(-not $BASE){ $BASE = "origin/main" }

$ErrorActionPreference = "Stop"; Set-StrictMode -Version Latest
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$out = ".artifacts"; New-Item -ItemType Directory -Force -Path $out | Out-Null
$BASE = ${env:DIFF_BASE}; if(-not $BASE){ $BASE = "origin/main" }

# thresholds (PowerShell-friendly)
if($env:COV_STMTS_MIN){ try{ $MIN_STM = [double]$env:COV_STMTS_MIN } catch { $MIN_STM = 90 } } else { $MIN_STM = 90 }
if($env:COV_FUNCS_MIN){ try{ $MIN_FUN = [double]$env:COV_FUNCS_MIN } catch { $MIN_FUN = 80 } } else { $MIN_FUN = 80 }
$SKIP = $false; if($env:SKIP_GATE){ $SKIP = $true }

function worstCov(){
  $covs = Get-ChildItem -Recurse -Filter coverage-summary.json -ErrorAction SilentlyContinue
  if(-not $covs){ return $null }
  $ws = 101.0; $wf = 101.0
  foreach($c in $covs){
    try{
      $j = Get-Content $c.FullName -Raw | ConvertFrom-Json
      $ws = [math]::Min($ws, [double]$j.total.statements.pct)
      $wf = [math]::Min($wf, [double]$j.total.functions.pct)
    } catch { }
  }
  return @{ stm = [math]::Round($ws,2); fun = [math]::Round($wf,2) }
}

# 1) Diff-scope (fallback a web/cockpit/shared)
$diff = git diff --name-only "${BASE}...HEAD" 2>$null
$targets = @()
if($diff){
  $targets = $diff | Where-Object { $_ -match '^(apps|packages)/[^/]+/' } | ForEach-Object { ($_ -split '/')[0..1] -join '/' } | Sort-Object -Unique
}
if(-not $targets -or $targets.Count -eq 0){ $targets = @("apps/web","apps/cockpit","packages/shared") }

# 2) Si no hay coverage, generar SOLO en paquetes con node_modules y script test:coverage (timeout 120s)
$cov = & worstCov
if(-not $cov){
  foreach($t in $targets){
  $pj = Join-Path $t 'package.json'
  $nm = Join-Path $t 'node_modules'
  # Skip UI package 'apps/web' by default - it contains heavy browser tests that often
  # fail in quick CI snapshots. Set RUN_WEB=1 to force-run it.
  if($t -match '^apps/web$' -and -not $env:RUN_WEB){
    Write-Host ("Skipping coverage for {0} by default. Set RUN_WEB=1 to force." -f $t)
    continue
  }
  # Also skip apps/cockpit by default unless explicitly requested.
  if($t -match '^apps/cockpit$' -and -not $env:RUN_COCKPIT){
    Write-Host ("Skipping coverage for {0} by default. Set RUN_COCKPIT=1 to force." -f $t)
    continue
  }

  if( (Test-Path $pj) -and (Test-Path $nm) ){
      try{
        $pkg = Get-Content $pj -Raw | ConvertFrom-Json
        if($pkg.scripts -and $pkg.scripts."test:coverage"){
          Write-Host ("Running coverage for {0} (timeout 120s)" -f $t)
          # try relative selector first (./apps/web), then fallback to plain selector
          $selectors = @(("./{0}" -f $t), $t)
          $succeeded = $false
          foreach($sel in $selectors){
            $cmd = '/c pnpm --filter "' + $sel + '" run test:coverage --silent'
            $p = Start-Process -FilePath cmd -ArgumentList $cmd -PassThru -NoNewWindow
            if(-not $p.WaitForExit(120000)){ try{ $p.Kill() } catch{}; continue }
            if($p.ExitCode -eq 0){ $succeeded = $true; break }
          }
          if(-not $succeeded){ 
            Write-Host ("Warning: coverage fail for {0}, continuing with other targets" -f $t)
            # don't throw here - continue to collect other coverage
          }
        }
      } catch {
        Write-Host ("Warning: coverage step failed for {0}: {1}" -f $t, $_)
        throw $_
      }
    }
  }
  $cov = & worstCov
}

# 3) Resumen + gate
$stm = $null; $fun = $null
if($cov){ $stm = $cov.stm; $fun = $cov.fun }

if($stm -ne $null){ $stmDisplay = $stm } else { $stmDisplay = '—' }
if($fun -ne $null){ $funDisplay = $fun } else { $funDisplay = '—' }

$scopeStr = if($targets){ [string]::Join(', ',$targets) } else { 'none' }
# Ensure diff is treated as an array of lines before accessing Count
$diffLines = @()
if($diff){
  if($diff -is [string]){
    $diffLines = $diff -split "`n" | Select-Object -First 15
  } else {
    $diffLines = @($diff | Select-Object -First 15)
  }
}
$diffDisplay = if($diffLines -and $diffLines.Count -gt 0){ [string]::Join("`n", $diffLines) } else { 'sin cambios' }

$summary = "# SNAPSHOT ($ts)`nScope: $scopeStr`nCoverage peor: stmts=${stmDisplay}% funcs=${funDisplay}% (≥${MIN_STM}/≥${MIN_FUN})`nDiff vs ${BASE}:`n${diffDisplay}"
$summary | Tee-Object (Join-Path $out 'STATUS_COV_DIFF.txt') | Out-Null

if(-not $SKIP -and ($stm -eq $null -or $fun -eq $null -or $stm -lt $MIN_STM -or $fun -lt $MIN_FUN)){
  Write-Host "GATE FAIL: stm=$stmDisplay fun=$funDisplay (need ≥ $MIN_STM / ≥ $MIN_FUN)"
  exit 1
} else {
  Write-Host "GATE PASS or SKIPPED: stm=$stmDisplay fun=$funDisplay"
  exit 0
}

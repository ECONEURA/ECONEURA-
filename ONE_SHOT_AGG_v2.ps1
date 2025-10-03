$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
chcp 65001 >$null; [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
$ts = Get-Date -f "yyyyMMdd-HHmmss"
$out = ".artifacts"
New-Item -ItemType Directory -Force -Path $out | Out-Null

# Parámetros
$BASE = $env:DIFF_BASE
if(-not $BASE){ $BASE = 'origin/main' }

$MIN_STM = 90.0
if($env:COV_STMTS_MIN){ try { $MIN_STM = [double]$env:COV_STMTS_MIN } catch { } }

$MIN_FUN = 80.0
if($env:COV_FUNCS_MIN){ try { $MIN_FUN = [double]$env:COV_FUNCS_MIN } catch { } }

$SKIP_GATE = '0'
if($env:SKIP_GATE){ $SKIP_GATE = '1' }

# 1) Diff-scope seguro y limitado
$diff = @()
try {
  $diff = git diff --name-only "${BASE}...HEAD" 2>$null
} catch {
  $diff = @()
}
$diff = @($diff)
$targets = $diff |
  Where-Object { $_ -match '^(apps|packages)/[^/]+/' } |
  ForEach-Object { ($_ -split '/')[0..1] -join '/' } |
  Sort-Object -Unique
if(-not $targets -or $targets.Count -eq 0){ $targets = @('apps/web','apps/cockpit','packages/shared') }

# 2) Buscar coverage rápido: primero summaries, si no hay usa lcov con lectura parcial
$stmList = New-Object System.Collections.Generic.List[double]
$funList = New-Object System.Collections.Generic.List[double]

# diagnostics accumulator
$diagLines = New-Object System.Collections.Generic.List[string]

# 2a) coverage-summary.json (O(archivos))
function Get-InTargets {
  param([string]$pattern, [string[]]$paths)
  $res = @()
  foreach($p in $paths){
    try {
      if(Test-Path $p){ $res += Get-ChildItem -Path $p -Recurse -Filter $pattern -File -ErrorAction SilentlyContinue }
    } catch {}
  }
  return $res
}

$found = Get-InTargets -pattern 'coverage-summary.json' -paths $targets
if($found -and $found.Count -gt 0){
  foreach($f in $found){
    try {
      $diagLines.Add("Found coverage-summary.json: $($f.FullName)") | Out-Null
      $j = Get-Content $f.FullName -Raw | ConvertFrom-Json
      if($j.total -and $j.total.statements -and $j.total.functions){
        $stmPct = [double]$j.total.statements.pct
        $funPct = [double]$j.total.functions.pct
        $diagLines.Add("  parsed: statements.pct=$stmPct functions.pct=$funPct") | Out-Null
        [void]$stmList.Add($stmPct)
        [void]$funList.Add($funPct)
      } else {
        $diagLines.Add("  parsed but missing expected keys (total.statements/total.functions)") | Out-Null
      }
    } catch {
      $diagLines.Add("  parse error: $($_.Exception.Message)") | Out-Null
    }
  }
} else { $diagLines.Add("No coverage-summary.json files found") | Out-Null }

# 2c) vitest reports JSON (fallback)
if($stmList.Count -eq 0 -or $funList.Count -eq 0){
  # look for reports named vitest.json or any vitest*.json under reports/
  $foundVitest = Get-InTargets -pattern 'vitest.json' -paths $targets
  if(-not $foundVitest -or $foundVitest.Count -eq 0){
    # also try a looser match inside targets
    $foundVitest = @()
    foreach($p in $targets){ try { if(Test-Path $p){ $foundVitest += Get-ChildItem -Path $p -Recurse -Include '*vitest*.json' -File -ErrorAction SilentlyContinue } } catch {} }
  }
  if($foundVitest -and $foundVitest.Count -gt 0){
    foreach($f in $foundVitest){
      try{
        $diagLines.Add("Found vitest JSON: $($f.FullName)") | Out-Null
        $r = Get-Content $f.FullName -Raw | ConvertFrom-Json
        if($r.coverage -and $r.coverage.total){
          if($r.coverage.total.statements -and $r.coverage.total.functions){
            $s = [double]$r.coverage.total.statements.pct
            $fu = [double]$r.coverage.total.functions.pct
            $diagLines.Add("  parsed: statements.pct=$s functions.pct=$fu") | Out-Null
            [void]$stmList.Add($s)
            [void]$funList.Add($fu)
          } else {
            $diagLines.Add("  coverage.total present but missing statements/functions keys") | Out-Null
          }
        } else {
          $diagLines.Add("  vitest JSON present but no coverage.total key") | Out-Null
        }
      } catch {
        $diagLines.Add("  parse error: $($_.Exception.Message)") | Out-Null
      }
    }
  } else { $diagLines.Add("No vitest JSON reports found") | Out-Null }
}

# 2d) coverage-final.json (nyc/c8 style) - compute totals across files if present
if($stmList.Count -eq 0 -or $funList.Count -eq 0){
  $foundFinal = Get-InTargets -pattern 'coverage-final.json' -paths $targets
  if($foundFinal -and $foundFinal.Count -gt 0){
    foreach($f in $foundFinal){
      try{
        $diagLines.Add("Found coverage-final.json: $($f.FullName)") | Out-Null
        $obj = Get-Content $f.FullName -Raw | ConvertFrom-Json
        $totalStatements = 0; $coveredStatements = 0; $totalFunctions = 0; $coveredFunctions = 0
        foreach($p in $obj.PSObject.Properties){
          $v = $p.Value
          if(-not $v){
            $diagLines.Add("  file $($p.Name) has null value; skipping") | Out-Null
            continue
          }
          $propNames = @()
          try { $propNames = $v.PSObject.Properties | ForEach-Object { $_.Name } } catch { $propNames = @() }

          # statements detection
          if($propNames -contains 'statements' -and $v.statements -and $v.statements.total -and $v.statements.covered){
            $totalStatements += [int]$v.statements.total
            $coveredStatements += [int]$v.statements.covered
            $diagLines.Add("  file $($p.Name) uses statements.total/covered -> total=$($v.statements.total) covered=$($v.statements.covered)") | Out-Null
          } elseif($propNames -contains 's'){
            try{
              $sMap = @()
              foreach($sp in $v.s.PSObject.Properties){ $sMap += [int]$sp.Value }
              $fileTotal = ($sMap).Count
              $fileCovered = ($sMap | Where-Object { $_ -gt 0 }).Count
              $totalStatements += $fileTotal
              $coveredStatements += $fileCovered
              $diagLines.Add("  file $($p.Name) uses s-map -> total=$fileTotal covered=$fileCovered") | Out-Null
            } catch {
              $diagLines.Add("  file $($p.Name) s-map parse error: $($_.Exception.Message)") | Out-Null
            }
          } else {
            $diagLines.Add("  file $($p.Name) missing statements/s keys; available keys: $([string]::Join(',', $propNames))") | Out-Null
          }

          # functions detection
          if($propNames -contains 'functions' -and $v.functions -and $v.functions.total -and $v.functions.covered){
            $totalFunctions += [int]$v.functions.total
            $coveredFunctions += [int]$v.functions.covered
            $diagLines.Add("  file $($p.Name) uses functions.total/covered -> total=$($v.functions.total) covered=$($v.functions.covered)") | Out-Null
          } elseif($propNames -contains 'f'){
            try{
              $fMapVals = @()
              foreach($fp in $v.f.PSObject.Properties){ $fMapVals += [int]$fp.Value }
              $fileTotalF = ($fMapVals).Count
              $fileCoveredF = ($fMapVals | Where-Object { $_ -gt 0 }).Count
              $totalFunctions += $fileTotalF
              $coveredFunctions += $fileCoveredF
              $diagLines.Add("  file $($p.Name) uses f-map -> totalF=$fileTotalF coveredF=$fileCoveredF") | Out-Null
            } catch {
              $diagLines.Add("  file $($p.Name) f-map parse error: $($_.Exception.Message)") | Out-Null
            }
          } else {
            $diagLines.Add("  file $($p.Name) missing functions/f keys; available keys: $([string]::Join(',', $propNames))") | Out-Null
          }
        }
        if($totalStatements -gt 0){ $val = [math]::Round(100.0*$coveredStatements/[double]$totalStatements,2); $diagLines.Add("  computed: statements=$val (covered $coveredStatements / total $totalStatements)") | Out-Null; [void]$stmList.Add($val) }
        if($totalFunctions -gt 0){ $valf = [math]::Round(100.0*$coveredFunctions/[double]$totalFunctions,2); $diagLines.Add("  computed: functions=$valf (covered $coveredFunctions / total $totalFunctions)") | Out-Null; [void]$funList.Add($valf) }
      } catch {
        $diagLines.Add("  parse error: $($_.Exception.Message)") | Out-Null
      }
    }
  } else { $diagLines.Add("No coverage-final.json files found") | Out-Null }
}

# 2b) lcov.info (solo si aún no tenemos métricas) con lectura en streaming
if($stmList.Count -eq 0 -or $funList.Count -eq 0){
  $lcovs = Get-InTargets -pattern 'lcov.info' -paths $targets
  if(-not $lcovs -or $lcovs.Count -eq 0){
    $lcovs = @()
  }
  $lcovs | Select-Object -First 5 | ForEach-Object {
      try {
        $lf = 0; $lh = 0; $fnf = 0; $fnh = 0
        foreach($line in [IO.File]::ReadLines($_.FullName)){
          if($line.StartsWith('LF:')){ $lf += [int]$line.Substring(3) }
          elseif($line.StartsWith('LH:')){ $lh += [int]$line.Substring(3) }
          elseif($line.StartsWith('FNF:')){ $fnf += [int]$line.Substring(4) }
          elseif($line.StartsWith('FNH:')){ $fnh += [int]$line.Substring(4) }
        }
        $diagLines.Add("Found lcov.info: $($_.FullName) LF=$lf LH=$lh FNF=$fnf FNH=$fnh") | Out-Null
        if($lf -gt 0){ $v = [math]::Round(100.0*$lh/[double]$lf,2); $diagLines.Add("  computed statements pct=$v") | Out-Null; [void]$stmList.Add($v) }
        if($fnf -gt 0){ $vf = [math]::Round(100.0*$fnh/[double]$fnf,2); $diagLines.Add("  computed functions pct=$vf") | Out-Null; [void]$funList.Add($vf) }
      } catch {}
    }
}

# 3) Peor cobertura disponible y veredicto
$stm = if($stmList.Count -gt 0){ ($stmList | Measure-Object -Minimum).Minimum } else { $null }
$fun = if($funList.Count -gt 0){ ($funList | Measure-Object -Minimum).Minimum } else { $null }
$gate = if($stm -ne $null -and $fun -ne $null -and $stm -ge $MIN_STM -and $fun -ge $MIN_FUN){ 'PASS' } else { 'WARN' }

# prepare printable strings (PowerShell-safe, no ??)
$stmStr = if($stm -ne $null){ $stm.ToString() } else { '—' }
$funStr = if($fun -ne $null){ $fun.ToString() } else { '—' }
$scope = [string]::Join(', ', @($targets))
$diffLines = @($diff | Select-Object -First 20)
$diffText = if($diffLines.Count -gt 0){ [string]::Join("`n", $diffLines) } else { '' }

# 4) Snapshot minimal
$res = @"
# ECONEURA ONE-SHOT AGG v2 ($ts)
Scope(diff): $scope
Peor coverage: stmts=$stmStr% funcs=$funStr% → Gate(≥$MIN_STM/≥$MIN_FUN): $gate
Diff vs ${BASE}:
$diffText
"@
foreach($l in $diagLines){ $res += "`nDIAG: $l" }
$res | Tee-Object "$out\STATUS_COV_DIFF.txt" | Out-Null

# 5) Exit code consciente
if($SKIP_GATE -ne '1' -and $gate -eq 'WARN'){ exit 1 } else { exit 0 }

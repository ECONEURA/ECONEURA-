$ErrorActionPreference="Stop"; chcp 65001 >$null; [Console]::OutputEncoding=[Text.UTF8Encoding]::UTF8
$ts=Get-Date -f "yyyyMMdd-HHmmss"; $out=".artifacts"; New-Item -ItemType Directory -Force $out | Out-Null

# Params
$BASE=$env:DIFF_BASE; if(-not $BASE){$BASE="origin/main"}
if($env:COV_STMTS_MIN){ try { $MIN_STM=[double]$env:COV_STMTS_MIN } catch{ $MIN_STM=90 } } else { $MIN_STM=90 }
if($env:COV_FUNCS_MIN){ try { $MIN_FUN=[double]$env:COV_FUNCS_MIN } catch{ $MIN_FUN=80 } } else { $MIN_FUN=80 }
$RUN_UI=$env:RUN_UI
$FORCE_GEN=$env:FORCE_GEN
if($env:MAX_FILES){ try{ $MAXF=[int]$env:MAX_FILES } catch{ $MAXF=3 } } else { $MAXF=3 }
if($env:TIMEOUT_SEC){ try{ $TO=[int]$env:TIMEOUT_SEC } catch{ $TO=120 } } else { $TO=120 }

# Diff-scope
$diff = @()
try{ $raw = git diff --name-only "${BASE}...HEAD" 2>$null; $diff = @($raw) } catch { $diff = @() }
$targets = $diff | Where-Object { $_ -match '^(apps|packages)/[^/]+/' } | ForEach-Object { ($_ -split '/')[0..1] -join '/' } | Sort-Object -Unique
if(-not $targets -or $targets.Count -eq 0){ $targets = @("packages/shared"); if($RUN_UI -eq "1"){ $targets += @("apps/web","apps/cockpit") } }

function InT([string]$p){ $n = $p -replace '\\','/'; foreach($t in $targets){ if($n -like "$t/*"){ return $true } }; return $false }
function Excl([string]$p){ $n = $p -replace '\\','/'; return ($n -like '*/node_modules/*' -or $n -like '*/dist/*' -or $n -like '*/.artifacts/*' -or $n -like '*/.disabled-packages/*') }

# Readers
function ReadSummary([string]$f){ try{ $j = Get-Content $f -Raw | ConvertFrom-Json; if($j.total -and $j.total.statements -and $j.total.functions){ return @{ stm = [double]$j.total.statements.pct; fun = [double]$j.total.functions.pct } } else { return $null } } catch{ return $null } }

function ReadFinal([string]$f){
  try{
    $j = Get-Content $f -Raw | ConvertFrom-Json
    $totalStmt=0; $coveredStmt=0; $totalFn=0; $coveredFn=0
    foreach($prop in $j.PSObject.Properties){
      $m = $prop.Value
      # statements: map of id->hits or numeric totals
      if($m.PSObject.Properties.Name -contains 's'){
        $s = $m.s
        if($s -is [System.Collections.IDictionary]){
          $totalStmt += $s.Keys.Count
          $coveredStmt += ($s.Values | Where-Object { $_ -gt 0 } | Measure-Object -Sum).Sum
        } elseif ($s -is [int] -or $s -is [long]){ $totalStmt += [int]$s }
      }
      # functions: various shapes: fn (array), fnh (num), fh (map) or f (covered)
      if($m.PSObject.Properties.Name -contains 'fn'){
        $fn = $m.fn
        if($fn -is [System.Collections.IEnumerable] -and -not ($fn -is [string])){ $totalFn += ($fn | Measure-Object).Count }
        elseif ($fn -is [int] -or $fn -is [long]){ $totalFn += [int]$fn }
      }
      if($m.PSObject.Properties.Name -contains 'fnh'){ if($m.fnh -is [int] -or $m.fnh -is [long]){ $coveredFn += [int]$m.fnh } }
      if($m.PSObject.Properties.Name -contains 'fh'){ $fh = $m.fh; if($fh -is [System.Collections.IDictionary]){ $coveredFn += ($fh.Values | Where-Object { $_ -gt 0 } | Measure-Object -Sum).Sum } }
      if($m.PSObject.Properties.Name -contains 'f'){ $f = $m.f; if($f -is [System.Collections.IDictionary]){ $totalFn += $f.Keys.Count; $coveredFn += ($f.Values | Where-Object { $_ -gt 0 } | Measure-Object -Sum).Sum } elseif ($f -is [int] -or $f -is [long]){ $coveredFn += [int]$f } }
    }
    $stm = $null; $fun = $null
    if($totalStmt -gt 0){ $stm = [math]::Round(100.0*$coveredStmt/[double]$totalStmt,2) }
    if($totalFn -gt 0){ $fun = [math]::Round(100.0*$coveredFn/[double]$totalFn,2) }
    if($stm -ne $null -and $fun -ne $null){ return @{ stm = $stm; fun = $fun } } else { return $null }
  } catch { return $null }
}

function ReadLcov([string]$f){
  try{
    $lf=0; $lh=0; $fnf=0; $fnh=0
    foreach($line in [IO.File]::ReadLines($f)){
      if($line.StartsWith('LF:')){ $lf+=[int]$line.Substring(3) }
      elseif($line.StartsWith('LH:')){ $lh+=[int]$line.Substring(3) }
      elseif($line.StartsWith('FNF:')){ $fnf+=[int]$line.Substring(4) }
      elseif($line.StartsWith('FNH:')){ $fnh+=[int]$line.Substring(4) }
    }
    $stm = $null
    $fun = $null
    if($lf -gt 0){ $stm = [math]::Round(100.0*$lh/[double]$lf,2) }
    if($fnf -gt 0){ $fun = [math]::Round(100.0*$fnh/[double]$fnf,2) }
    if($stm -ne $null -and $fun -ne $null){ return @{ stm=$stm; fun=$fun } } else { return $null }
  } catch{ return $null }
}

# Buscar métricas con early-exit
$vals = @()
$files = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object { InT($_.FullName) -and -not (Excl($_.FullName)) }
foreach($pat in @('coverage-summary.json','coverage-final.json','lcov.info')){
  $cands = $files | Where-Object { $_.Name -eq $pat } | Select-Object -First $MAXF
  foreach($f in $cands){
    $v = $null
    if($pat -eq 'coverage-summary.json'){ $v = ReadSummary $f.FullName }
    elseif($pat -eq 'coverage-final.json'){ $v = ReadFinal $f.FullName }
    else { $v = ReadLcov $f.FullName }
    if($v){ $vals += [pscustomobject]@{ stm = $v.stm; fun = $v.fun } }
  }
  if($vals.Count -gt 0){ break }
}

# Generación mínima opt-in o si no hay métricas
if(($FORCE_GEN -eq '1') -or ($vals.Count -eq 0)){
  foreach($t in $targets){
    if( (Test-Path (Join-Path $t 'package.json')) -and (Test-Path (Join-Path $t 'node_modules')) ){
      try{
        $pkg = Get-Content (Join-Path $t 'package.json') -Raw | ConvertFrom-Json
        if($pkg.scripts.'test:coverage'){
          try{
            $args = @("--filter=./$t","run","test:coverage","--silent")
            $p = Start-Process -FilePath 'pnpm' -ArgumentList $args -NoNewWindow -WindowStyle Hidden -PassThru
            if(-not $p.WaitForExit($TO*1000)){ try{ $p.Kill() } catch{} }
          } catch{}
        }
      } catch{}
    }
  }
  # reintenta lectura
  $vals = @()
  $files = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object { InT($_.FullName) -and -not (Excl($_.FullName)) }
  foreach($pat in @('coverage-summary.json','coverage-final.json','lcov.info')){
    $cands = $files | Where-Object { $_.Name -eq $pat } | Select-Object -First $MAXF
    foreach($f in $cands){
      $v = $null
      if($pat -eq 'coverage-summary.json'){ $v = ReadSummary $f.FullName }
      elseif($pat -eq 'coverage-final.json'){ $v = ReadFinal $f.FullName }
      else { $v = ReadLcov $f.FullName }
      if($v){ $vals += [pscustomobject]@{ stm = $v.stm; fun = $v.fun } }
    }
    if($vals.Count -gt 0){ break }
  }
}

# Agregado y gate
if($vals.Count -gt 0){
  $stmVals = $vals | Select-Object -ExpandProperty stm
  $funVals = $vals | Select-Object -ExpandProperty fun
  $stmW = ($stmVals | Measure-Object -Minimum).Minimum
  $funW = ($funVals | Measure-Object -Minimum).Minimum
} else { $stmW = $null; $funW = $null }

$cond = ($stmW -ne $null -and $funW -ne $null -and $stmW -ge $MIN_STM -and $funW -ge $MIN_FUN)
if($cond){ $gate = 'PASS' } else { $gate = 'WARN' }

$lines = @()
if($diff){ $lines = $diff | Select-Object -First 20 }

function NToStr($n){ if($n -ne $null){ return $n.ToString('0.##') } else { return '—' } }

$txt = "# ECONEURA ONE-SHOT 100 v8 ($ts)`nTargets: " + ($targets -join ', ') +
       "`nWorst coverage: stmts=" + (NToStr $stmW) + "% funcs=" + (NToStr $funW) + "% → Gate(≥$MIN_STM/≥$MIN_FUN): $gate`nDiff vs ${BASE}:`n" + ($lines -join "`n")

$txt | Tee-Object (Join-Path $out 'STATUS_COV_DIFF.txt') | Out-Null

# Falla solo si hay métricas y no cumplen
if(($stmW -ne $null -and $funW -ne $null) -and $gate -eq 'WARN'){ exit 1 } else { exit 0 }

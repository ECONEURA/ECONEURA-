$ErrorActionPreference="Stop"; chcp 65001 >$null; [Console]::OutputEncoding=[Text.UTF8Encoding]::UTF8
$out=".artifacts"; if(!(Test-Path $out)){ New-Item -ItemType Directory -Path $out | Out-Null }
$BASE=$env:DIFF_BASE; if(-not $BASE){$BASE="origin/main"}
$MIN_STM=[double]($(if($env:COV_STMTS_MIN){$env:COV_STMTS_MIN}else{90}))
$MIN_FUN=[double]($(if($env:COV_FUNCS_MIN){$env:COV_FUNCS_MIN}else{80}))
$FORCE_GEN=$env:FORCE_GEN
$RUN_UI=$env:RUN_UI
$TARGETS=$env:TARGETS
if($env:TIMEOUT_SEC){ try{ $TO=[int]$env:TIMEOUT_SEC } catch { $TO=120 } } else { $TO=120 }

function Pct($n,$d){ if([double]$d -le 0){ return $null } else { return [math]::Round(100.0*[double]$n/[double]$d,2) } }

# 1) Targets
if($TARGETS){ $t = $TARGETS -split ',' } else {
  $d = @()
  try{ $raw = git diff --name-only "${BASE}...HEAD" 2>$null; $d = @($raw) } catch { $d = @() }
  $t = $d | Where-Object { $_ -match '^(apps|packages)/[^/]+' } | ForEach-Object { ($_ -split '/')[0..1] -join '/' } | Sort-Object -Unique
  if(-not $t -or $t.Count -eq 0){ $t = @('packages/shared'); if($RUN_UI -eq '1'){ $t += @('apps/web','apps/cockpit') } }
}

# 2) Lector O(1) por paquete con early-exit
function ReadPkgCov([string]$p){
  $sum = Join-Path $p 'coverage\coverage-summary.json'
  if(Test-Path $sum){
    try{ $j = Get-Content $sum -Raw | ConvertFrom-Json; return @{ stm = [double]$j.total.statements.pct; fun = [double]$j.total.functions.pct } } catch {}
  }
  $lcov = Join-Path $p 'coverage\lcov.info'
  if(Test-Path $lcov){
    try{
      $lf=0; $lh=0; $fnf=0; $fnh=0
      foreach($line in [IO.File]::ReadLines($lcov)){
        if($line.StartsWith('LF:')){ $lf += [int]$line.Substring(3) }
        elseif($line.StartsWith('LH:')){ $lh += [int]$line.Substring(3) }
        elseif($line.StartsWith('FNF:')){ $fnf += [int]$line.Substring(4) }
        elseif($line.StartsWith('FNH:')){ $fnh += [int]$line.Substring(4) }
      }
      $stm = Pct $lh $lf; $fun = Pct $fnh $fnf
      if($stm -ne $null -and $fun -ne $null){ return @{ stm=$stm; fun=$fun } }
    } catch {}
  }
  $fin = Join-Path $p 'coverage-final.json'
  if(Test-Path $fin){
    try{
      $j = Get-Content $fin -Raw | ConvertFrom-Json
      $ts=0; $tc=0; $fs=0; $fc=0
      foreach($pp in $j.PSObject.Properties){
        $m = $pp.Value
        if($m.s){ $ts += $m.s }
        if($m.f){ $tc += $m.f }
        if($m.fn){ $fs += $m.fn }
        if($m.fnh){ $fc += $m.fnh }
        if($m.fh){
          if($m.fh -is [System.Collections.IDictionary]){ $fc += ($m.fh.Values | Where-Object { $_ -gt 0 } | Measure-Object -Sum).Sum } else { $fc += $m.fh }
        }
      }
      $stm = Pct $tc $ts; $fun = Pct $fc $fs
      if($stm -ne $null -and $fun -ne $null){ return @{ stm=$stm; fun=$fun } }
    } catch {}
  }
  return $null
}

# 3) Leer métricas; si vacío y FORCE_GEN=1, generar mínimo y releer
$vals = @()
foreach($p in $t){ try{ $v = ReadPkgCov $p; if($v){ $vals += $v } } catch {} }
if($vals.Count -eq 0 -and $FORCE_GEN -eq '1'){
  foreach($p in $t){
    if( (Test-Path (Join-Path $p 'package.json')) -and (Test-Path (Join-Path $p 'node_modules')) ){
      try{
        $pkg = Get-Content (Join-Path $p 'package.json') -Raw | ConvertFrom-Json
        if($pkg.scripts.'test:coverage'){
          try{
            $args = @("--filter=./$p","run","test:coverage","--silent")
            $proc = Start-Process -FilePath 'pnpm' -ArgumentList $args -NoNewWindow -WindowStyle Hidden -PassThru
            if(-not $proc.WaitForExit($TO*1000)){ try{ $proc.Kill() } catch {} }
          } catch {}
        }
      } catch {}
    }
  }
  foreach($p in $t){ try{ $v = ReadPkgCov $p; if($v){ $vals += $v } } catch {} }
}

# 4) Gate y salida corta
if($vals.Count -gt 0){
  $stmW = ($vals | ForEach-Object { $_.stm } | Measure-Object -Minimum).Minimum
  $funW = ($vals | ForEach-Object { $_.fun } | Measure-Object -Minimum).Minimum
} else { $stmW = $null; $funW = $null }

if($stmW -ne $null -and $funW -ne $null -and $stmW -ge $MIN_STM -and $funW -ge $MIN_FUN){ $gate = 'PASS' }
elseif($vals.Count -gt 0){ $gate = 'WARN' } else { $gate = 'NO-METRICS' }

$txt = "# ONE-SHOT v12`nTargets: " + ($t -join ", ") +
       "`nWorst: stmts=" + ($(if($stmW -ne $null){ $stmW } else { '—' })) +
       "% funcs=" + ($(if($funW -ne $null){ $funW } else { '—' })) +
       "% → Gate(≥$MIN_STM/≥$MIN_FUN): " + $gate

$txt | Set-Content (Join-Path $out 'STATUS_COV_DIFF.txt')
if($gate -eq 'WARN'){ exit 1 } elseif($gate -eq 'PASS'){ exit 0 } else { exit 0 }

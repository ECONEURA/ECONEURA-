$ErrorActionPreference = 'Stop'
chcp 65001 > $null
[Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
$out = ".artifacts"; if(-not (Test-Path $out)){ New-Item -ItemType Directory -Path $out | Out-Null }
# Compute mins with PowerShell-compatible fallbacks
$MIN_STM = 90.0
if($env:COV_STMTS_MIN){
  try{ $MIN_STM = [double]$env:COV_STMTS_MIN } catch { $MIN_STM = 90.0 }
}
$MIN_FUN = 80.0
if($env:COV_FUNCS_MIN){
  try{ $MIN_FUN = [double]$env:COV_FUNCS_MIN } catch { $MIN_FUN = 80.0 }
}
$TARGETS = 'packages/shared'
if($env:TARGETS){ $TARGETS = $env:TARGETS }
$TARGETS = $TARGETS -split ','

function Pct($n,$d){ if([double]$d -le 0){ $null } else { [math]::Round(100.0*[double]$n/[double]$d,2) } }
function ReadCovPkg($p){
  $s=Join-Path $p "coverage\coverage-summary.json"; if(Test-Path $s){try{$j=gc $s -Raw|ConvertFrom-Json; return @{stm=[double]$j.total.statements.pct; fun=[double]$j.total.functions.pct}}catch{}}
  $l=Join-Path $p "coverage\lcov.info"; if(Test-Path $l){try{$lf=0;$lh=0;$fnf=0;$fnh=0; [IO.File]::ReadLines($l)|%{if($_.StartsWith('LF:')){$lf+=[int]$_.Substring(3)}elseif($_.StartsWith('LH:')){$lh+=[int]$_.Substring(3)}elseif($_.StartsWith('FNF:')){$fnf+=[int]$_.Substring(4)}elseif($_.StartsWith('FNH:')){$fnh+=[int]$_.Substring(4)}}; $stm=P $lh $lf; $fun=P $fnh $fnf; if($stm -and $fun){return @{stm=$stm; fun=$fun}}}catch{}}
  # try coverage-final in the package root, then in coverage\coverage-final.json
  $f1 = Join-Path $p "coverage-final.json"
  $f2 = Join-Path $p "coverage\coverage-final.json"
  $f = if(Test-Path $f2){ $f2 } elseif(Test-Path $f1){ $f1 } else { $null }
  if($f){
    try{
      $j = gc $f -Raw | ConvertFrom-Json
      $ts=0; $tc=0; $fs=0; $fc=0
      foreach($pp in $j.PSObject.Properties){
        $m = $pp.Value
        if($m.s){ $ts += ($m.s | Measure-Object).Sum }
        if($m.f){ $tc += ($m.f | Measure-Object).Sum }
        if($m.fn){ $fs += ($m.fn | Measure-Object).Sum }
        if($m.fnh){ $fc += ($m.fnh | Measure-Object).Sum }
        if($m.fh){
          if($m.fh -is [System.Collections.IDictionary]){ $fc += (($m.fh.Values | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count) } else { $fc += [int]$m.fh }
        }
      }
  $stm = Pct $tc $ts; $fun = Pct $fc $fs; if($stm -and $fun){ return @{ stm = $stm; fun = $fun } }
    } catch{}
  }
  $null
}

$vals = @()
$lines = @()
foreach($p in $TARGETS){
  $v = ReadCovPkg $p
  $stm_display = if($v){ $v.stm } else { '—' }
  $fun_display = if($v){ $v.fun } else { '—' }
  $lines += "pkg=$p stm=$stm_display fun=$fun_display"
  if($v){
    if($v.stm -ge $MIN_STM -and $v.fun -ge $MIN_FUN){
      ("# PASS`n" + ($lines -join "`n")) | Set-Content "$out\STATUS_COV_DIFF.txt"
      exit 0
    }
    $vals += $v
  }
}

$stmW = if($vals.Count){ ($vals | ForEach-Object { $_.stm } | Measure-Object -Minimum).Minimum } else { $null }
$funW = if($vals.Count){ ($vals | ForEach-Object { $_.fun } | Measure-Object -Minimum).Minimum } else { $null }
$gate = if($stmW -ne $null -and $funW -ne $null -and $stmW -ge $MIN_STM -and $funW -ge $MIN_FUN){ 'PASS' } elseif($vals.Count){ 'WARN' } else { 'NO-METRICS' }

$targetsStr = $TARGETS -join ", "
$stm_disp = if($stmW){ $stmW } else { '—' }
$fun_disp = if($funW){ $funW } else { '—' }
$header = "# ONE-SHOT v13C`nTargets: $targetsStr`n`nWorst: stmts=${stm_disp}% funcs=${fun_disp}% → Gate(≥$MIN_STM/≥$MIN_FUN): $gate`n"
$final = $header + ($lines -join "`n")
$final | Set-Content "$out\STATUS_COV_DIFF.txt"
if($gate -eq 'PASS'){ exit 0 } elseif($gate -eq 'WARN'){ exit 2 } else { exit 3 }

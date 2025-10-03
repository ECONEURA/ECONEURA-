 $ErrorActionPreference = 'Stop'
 chcp 65001 > $null
 [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
 $out = ".artifacts"; if(-not (Test-Path $out)){ New-Item -ItemType Directory -Path $out | Out-Null }

# Defaults and env parsing (explicit, compatible)
$MIN_STM = 90.0
if($env:COV_STMTS_MIN){ try { $MIN_STM = [double]$env:COV_STMTS_MIN } catch { $MIN_STM = 90.0 } }
$MIN_FUN = 80.0
if($env:COV_FUNCS_MIN){ try { $MIN_FUN = [double]$env:COV_FUNCS_MIN } catch { $MIN_FUN = 80.0 } }
$TARGETS = 'packages/shared'
if($env:TARGETS){ $TARGETS = $env:TARGETS }
$TARGETS = $TARGETS -split ','

function Pct($n,$d){ if($d -gt 0){[math]::Round(100.0*$n/$d,2)} }

function ReadCovFast($p){
  $covDir = Join-Path $p 'coverage'
  if(-not (Test-Path $covDir)){ return $null }

  # 1) coverage-summary.json
  $cs = Join-Path $covDir 'coverage-summary.json'
  if(Test-Path $cs){
    try{ $j = Get-Content $cs -Raw | ConvertFrom-Json; return @{ stm = [double]$j.total.statements.pct; fun = [double]$j.total.functions.pct } } catch { Write-Host "WARN: fallo leyendo $cs" }
  }

  # 2) lcov.info
  $lc = Join-Path $covDir 'lcov.info'
  if(Test-Path $lc){
    try{
      $lf=0; $lh=0; $fnf=0; $fnh=0
      [IO.File]::ReadLines($lc) | ForEach-Object {
        if($_ -like 'LF:*'){ $lf += [int]$_.Substring(3) }
        elseif($_ -like 'LH:*'){ $lh += [int]$_.Substring(3) }
        elseif($_ -like 'FNF:*'){ $fnf += [int]$_.Substring(4) }
        elseif($_ -like 'FNH:*'){ $fnh += [int]$_.Substring(4) }
      }
      return @{ stm = Pct $lh $lf; fun = Pct $fnh $fnf }
    } catch { Write-Host "WARN: fallo leyendo $lc" }
  }

  # 3) coverage-final.json
  $cf = Join-Path $covDir 'coverage-final.json'
  if(Test-Path $cf){
    try{
      $j = Get-Content $cf -Raw | ConvertFrom-Json
      $ts = 0; $tc = 0; $fs = 0; $fc = 0
      foreach($prop in $j.PSObject.Properties){
        $m = $prop.Value
        if($m.s){ if($m.s -is [System.Collections.IDictionary]){ $ts += ($m.s.Values | Measure-Object -Sum).Sum } else { $ts += [double]$m.s } }
        if($m.f){ if($m.f -is [System.Collections.IDictionary]){ $tc += ($m.f.Values | Measure-Object -Sum).Sum } else { $tc += [double]$m.f } }
        if($m.fn){ if($m.fn -is [System.Collections.IDictionary]){ $fs += ($m.fn.Values | Measure-Object -Sum).Sum } else { $fs += [double]$m.fn } }
        if($m.fnh){ if($m.fnh -is [System.Collections.IDictionary]){ $fc += ($m.fnh.Values | Measure-Object -Sum).Sum } else { $fc += [double]$m.fnh } }
        if($m.fh){ if($m.fh -is [System.Collections.IDictionary]){ $fc += ($m.fh.Values | Measure-Object -Sum).Sum } else { $fc += [double]$m.fh } }
      }
      return @{ stm = Pct $tc $ts; fun = Pct $fc $fs }
    } catch { Write-Host "WARN: fallo leyendo $cf" }
  }

  return $null
}

$stmW=$null;$funW=$null;$lines=@()
foreach($p in $TARGETS){
  $v = ReadCovFast $p
  $stm_display = '—'; $fun_display = '—'
  if($v){ $stm_display = $v.stm; $fun_display = $v.fun }
  $lines += "pkg=$p stm=$stm_display fun=$fun_display"
  if($v){
    if($v.stm -ge $MIN_STM -and $v.fun -ge $MIN_FUN){
      ("# PASS`n" + ($lines -join "`n")) | Set-Content "$out\STATUS_COV_DIFF.txt"
      Write-Host "PASS $p"
      exit 0
    }
    if($stmW -eq $null -or $v.stm -lt $stmW){ $stmW = $v.stm }
    if($funW -eq $null -or $v.fun -lt $funW){ $funW = $v.fun }
  }
}
$gate= if($stmW -ne $null -and $funW -ne $null) {
  if($stmW -ge $MIN_STM -and $funW -ge $MIN_FUN){"PASS"} else {"WARN"}
} else {"NO-METRICS"}

$targetsStr = $TARGETS -join ", "
$stm_disp = if($stmW){ $stmW } else { '—' }
$fun_disp = if($funW){ $funW } else { '—' }
$header = "# ONE-SHOT v13D`nTargets: $targetsStr`n`nWorst: stmts=${stm_disp}% funcs=${fun_disp}% → Gate(≥$MIN_STM/≥$MIN_FUN): $gate`n"
$final = $header + ($lines -join "`n")
$final | Set-Content "$out\STATUS_COV_DIFF.txt"
Write-Host $gate "stm=$stmW fun=$funW"
$exitCode = 2
if($gate -eq 'PASS'){ $exitCode = 0 } elseif($gate -eq 'WARN'){ $exitCode = 1 } else { $exitCode = 2 }
exit $exitCode

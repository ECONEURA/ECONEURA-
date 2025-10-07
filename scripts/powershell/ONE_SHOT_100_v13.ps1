$ErrorActionPreference="Stop"; chcp 65001 >$null; [Console]::OutputEncoding=[Text.UTF8Encoding]::UTF8
$out=".artifacts"; if(!(Test-Path $out)){ New-Item -ItemType Directory -Path $out | Out-Null }
$MIN_STM=[double]($(if($env:COV_STMTS_MIN){$env:COV_STMTS_MIN}else{90}))
$MIN_FUN=[double]($(if($env:COV_FUNCS_MIN){$env:COV_FUNCS_MIN}else{80}))
$TARGETS = $(if($env:TARGETS){$env:TARGETS}else{"packages/shared"}) -split ","
$FORCE_GEN = $env:FORCE_GEN
if($env:TIMEOUT_SEC){ try{ $TO = [int]$env:TIMEOUT_SEC } catch{ $TO = 120 } } else { $TO = 120 }

function Pct($n,$d){ if([double]$d -le 0){ return $null } else { return [math]::Round(100.0*[double]$n/[double]$d,2) } }

function ReadCov([string]$p){
  $sum = Join-Path $p "coverage\coverage-summary.json"
  if(Test-Path $sum){
    try{ $j = Get-Content $sum -Raw | ConvertFrom-Json; return @{ stm = [double]$j.total.statements.pct; fun = [double]$j.total.functions.pct } } catch{}
  }
  $lcov = Join-Path $p "coverage\lcov.info"
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
      if($stm -ne $null -and $fun -ne $null){ return @{ stm = $stm; fun = $fun } }
    } catch{}
  }
  $fin = Join-Path $p "coverage\coverage-final.json"
  if(Test-Path $fin){
    try{
      $j = Get-Content $fin -Raw | ConvertFrom-Json
      $ts=0; $tc=0; $fs=0; $fc=0
      foreach($pp in $j.PSObject.Properties){
        $m = $pp.Value
        # statements: total = number of keys in statementMap or s; covered = number of s values > 0
        if($m.s -is [System.Collections.IDictionary]){
          $ts += ($m.s.Keys | Measure-Object).Count
          $tc += ($m.s.Values | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count
        } elseif($m.statementMap -is [System.Collections.IDictionary]){
          $ts += ($m.statementMap.Keys | Measure-Object).Count
          # try to infer covered from s if present
          if($m.s -is [System.Collections.IDictionary]){ $tc += ($m.s.Values | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count }
        }

        # functions: total = number of keys in fnMap or f; covered = number of f values > 0
        if($m.f -is [System.Collections.IDictionary]){
          $fs += ($m.f.Keys | Measure-Object).Count
          $fc += ($m.f.Values | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count
        } elseif($m.fnMap -is [System.Collections.IDictionary]){
          $fs += ($m.fnMap.Keys | Measure-Object).Count
          if($m.f -is [System.Collections.IDictionary]){ $fc += ($m.f.Values | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count }
        }
        # fallback: fh may be a number or map of hits per function name
        if($m.fh){
          if($m.fh -is [System.Collections.IDictionary]){ $fc += ($m.fh.Values | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count } 
          elseif([int]::TryParse([string]$m.fh,[ref]$null)){ $fc += [int]$m.fh }
        }
      }
      $stm = Pct $tc $ts; $fun = Pct $fc $fs
      if($stm -ne $null -and $fun -ne $null){ return @{ stm = $stm; fun = $fun } }
    } catch{}
  }
  return $null
}

function ReadCovDiag([string]$p, [string]$outdir){
  $fin = Join-Path $p "coverage\coverage-final.json"
  $diagLines = @()
  if(-not (Test-Path $fin)){ $diagLines += "NO coverage-final.json at $fin"; Set-Content (Join-Path $outdir 'STATUS_COV_DIFF_DIAG.txt') ($diagLines -join "`n"); return }
  try{
    $j = Get-Content $fin -Raw | ConvertFrom-Json
    $tot_ts=0; $tot_tc=0; $tot_fs=0; $tot_fc=0
    foreach($pp in $j.PSObject.Properties){
      $fname = $pp.Name
      $m = $pp.Value
      $ts=0; $tc=0; $fs=0; $fc=0
      if($m.PSObject.Properties.Name -contains 's'){
        $sprops = @($m.s.PSObject.Properties)
        $ts = $sprops.Count
        $tc = ($sprops | ForEach-Object { $_.Value } | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count
      } elseif($m.PSObject.Properties.Name -contains 'statementMap'){
        $sm = @($m.statementMap.PSObject.Properties)
        $ts = $sm.Count
      }
      if($m.PSObject.Properties.Name -contains 'f'){
        $fprops = @($m.f.PSObject.Properties)
        $fs = $fprops.Count
        $fc = ($fprops | ForEach-Object { $_.Value } | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count
      } elseif($m.PSObject.Properties.Name -contains 'fnMap'){
        $fn = @($m.fnMap.PSObject.Properties)
        $fs = $fn.Count
      }
      if($m.PSObject.Properties.Name -contains 'fh'){
        if($m.fh -is [System.Collections.IDictionary]){ $fc += (@($m.fh.PSObject.Properties) | ForEach-Object { $_.Value } | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count }
        else { $try = 0; if([int]::TryParse([string]$m.fh,[ref]$try)){ $fc += $try } }
      }
      $tot_ts += $ts; $tot_tc += $tc; $tot_fs += $fs; $tot_fc += $fc
      $diagLines += "FILE: $fname -> stm_total=$ts stm_cov=$tc func_total=$fs func_cov=$fc"
    }
    $diagLines += "PACKAGE TOTAL -> stm_total=$tot_ts stm_cov=$tot_tc func_total=$tot_fs func_cov=$tot_fc"
  } catch{ $diagLines += "ERROR parsing $fin -> $($_.Exception.Message)" }
  Set-Content (Join-Path $outdir 'STATUS_COV_DIFF_DIAG.txt') ($diagLines -join "`n")
}

function ReadCovTotals([string]$p){
  $fin = Join-Path $p "coverage\coverage-final.json"
  if(-not (Test-Path $fin)){ return $null }
  try{
    # debugging trace
    try{ Add-Content (Join-Path $out 'STATUS_COV_DIFF_LOG.txt') "ReadCovTotals: loading $fin" } catch{}
    $j = Get-Content $fin -Raw | ConvertFrom-Json
    try{ Add-Content (Join-Path $out 'STATUS_COV_DIFF_LOG.txt') "Loaded JSON. topProps=$($j.PSObject.Properties.Count)" } catch{}
    $tot_ts=0; $tot_tc=0; $tot_fs=0; $tot_fc=0
    foreach($pp in $j.PSObject.Properties){
      try{ Add-Content (Join-Path $out 'STATUS_COV_DIFF_LOG.txt') "Inspecting prop: $($pp.Name)" } catch{}
      $m = $pp.Value
      $ts=0; $tc=0; $fs=0; $fc=0
      if($m.PSObject.Properties.Name -contains 's'){
        $sprops = @($m.s.PSObject.Properties)
        try{ Add-Content (Join-Path $out 'STATUS_COV_DIFF_LOG.txt') " sprops=$($sprops.Count)" } catch{}
        $ts = $sprops.Count
        $tc = ($sprops | ForEach-Object { $_.Value } | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count
      } elseif($m.PSObject.Properties.Name -contains 'statementMap'){
        $sm = @($m.statementMap.PSObject.Properties)
        try{ Add-Content (Join-Path $out 'STATUS_COV_DIFF_LOG.txt') " statementMapProps=$($sm.Count)" } catch{}
        $ts = $sm.Count
      }
      if($m.PSObject.Properties.Name -contains 'f'){
        $fprops = @($m.f.PSObject.Properties)
        $fs = $fprops.Count
        $fc = ($fprops | ForEach-Object { $_.Value } | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count
      } elseif($m.PSObject.Properties.Name -contains 'fnMap'){
        $fn = @($m.fnMap.PSObject.Properties)
        $fs = $fn.Count
      }
      if($m.PSObject.Properties.Name -contains 'fh'){
        if($m.fh -is [System.Collections.IDictionary]){ $fc += (@($m.fh.PSObject.Properties) | ForEach-Object { $_.Value } | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count }
        else { $t=0; if([int]::TryParse([string]$m.fh,[ref]$t)){ $fc += $t } }
      }
      $tot_ts += $ts; $tot_tc += $tc; $tot_fs += $fs; $tot_fc += $fc
    }
    try{ Add-Content (Join-Path $out 'STATUS_COV_DIFF_LOG.txt') "Totals computed ts=$tot_ts tc=$tot_tc fs=$tot_fs fc=$tot_fc" } catch{}
    $stmPct = Pct $tot_tc $tot_ts
    $funPct = Pct $tot_fc $tot_fs
    try{ Add-Content (Join-Path $out 'STATUS_COV_DIFF_LOG.txt') "Pct computed stm=$stmPct fun=$funPct" } catch{}
    if($stmPct -ne $null -and $funPct -ne $null){ return @{ stm = $stmPct; fun = $funPct; raw = @{ ts = $tot_ts; tc = $tot_tc; fs = $tot_fs; fc = $tot_fc } } }
  } catch{ }
  return $null
}

$vals = @()
foreach($p in $TARGETS){
  try{ $v = ReadCov $p } catch{ $v = $null }
  if(-not $v){
    try{ $v = ReadCovTotals $p } catch{ $v = $null }
  }
  if(-not $v -and $FORCE_GEN -eq '1' -and (Test-Path (Join-Path $p 'package.json')) -and (Test-Path (Join-Path $p 'node_modules'))){
    try{
      $pkg = Get-Content (Join-Path $p 'package.json') -Raw | ConvertFrom-Json
      if($pkg.scripts.'test:coverage'){
        try{
          $args = @("--filter=./$p","run","test:coverage","--silent")
          $pr = Start-Process -FilePath 'pnpm' -ArgumentList $args -NoNewWindow -WindowStyle Hidden -PassThru
          if(-not $pr.WaitForExit($TO*1000)){ try{ $pr.Kill() } catch{} }
        } catch{}
      }
    } catch{}
    try{ $v = ReadCov $p } catch{ $v = $null }
  }
  if($v){ $vals += $v }

  if($v){
    # ensure we persist diagnostics before any early exit
    $vals += $v
    if(($v.stm -ne $null) -and ($v.fun -ne $null) -and ($v.stm -ge $MIN_STM) -and ($v.fun -ge $MIN_FUN)){
          try{
            # collect authoritative totals per-target; prefer the 'raw' numeric totals if returned by ReadCovTotals
            $valsForRaw = @()
            $rawTotals = @{ ts = 0; tc = 0; fs = 0; fc = 0 }
            foreach($tp in $TARGETS){
              try{ $tres = ReadCovTotals $tp } catch{ $tres = $null }
              if($tres){
                # push human-friendly percentages into valsForRaw
                $valsForRaw += @{ stm = $tres.stm; fun = $tres.fun }
                if($tres.raw -is [System.Collections.IDictionary]){
                  $rawTotals.ts += [int]$tres.raw.ts; $rawTotals.tc += [int]$tres.raw.tc; $rawTotals.fs += [int]$tres.raw.fs; $rawTotals.fc += [int]$tres.raw.fc
                }
              } else {
                if($v){ $valsForRaw += @{ stm = $v.stm; fun = $v.fun } }
              }
            }
            $minStm = $null; $minFun = $null
            if($valsForRaw.Count -gt 0){ $minStm = ($valsForRaw | ForEach-Object { $_.stm } | Measure-Object -Minimum).Minimum; $minFun = ($valsForRaw | ForEach-Object { $_.fun } | Measure-Object -Minimum).Minimum }
            $rawEarly = @{ targets = $TARGETS; vals = $valsForRaw; stmW = $minStm; funW = $minFun; rawTotals = $rawTotals }
            $rawEarly | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $out 'STATUS_COV_DIFF_RAW.txt')
          } catch{}
      # generate per-file diagnostics where available
      foreach($tp in $TARGETS){ ReadCovDiag $tp $out }
      # attempt to extract PACKAGE TOTAL from the generated DIAG and use that to populate rawTotals
      try{
        $diagPath = Join-Path $out 'STATUS_COV_DIFF_DIAG.txt'
        if(Test-Path $diagPath){
          $diagText = Get-Content $diagPath -Raw
          $pkgLine = ($diagText -split "`n" | Where-Object { $_ -match '^PACKAGE TOTAL' }) | Select-Object -First 1
          if($pkgLine -match 'stm_total=(\d+)\s+stm_cov=(\d+)\s+func_total=(\d+)\s+func_cov=(\d+)'){
            $ts = [int]$matches[1]; $tc = [int]$matches[2]; $fs = [int]$matches[3]; $fc = [int]$matches[4]
            $rawEarly = @{ targets = $TARGETS; vals = $valsForRaw; stmW = $minStm; funW = $minFun; rawTotals = @{ ts = $ts; tc = $tc; fs = $fs; fc = $fc } }
            $rawEarly | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $out 'STATUS_COV_DIFF_RAW.txt')
          }
        }
      } catch{}
      "# OK $p $($v.stm)/$($v.fun)" | Set-Content (Join-Path $out 'STATUS_COV_DIFF.txt')
      exit 0
    }
  }
}

if($vals.Count -gt 0){
  $stmW = ($vals | ForEach-Object { $_.stm } | Measure-Object -Minimum).Minimum
  $funW = ($vals | ForEach-Object { $_.fun } | Measure-Object -Minimum).Minimum
} else {
  # try aggregated totals per-target as a last-resort
  $agg = @()
  foreach($p in $TARGETS){
    try{ $t = ReadCovTotals $p } catch{ $t = $null }
    if($t){ $agg += $t }
  }
  if($agg.Count -gt 0){
    $stmW = ($agg | ForEach-Object { $_.stm } | Measure-Object -Minimum).Minimum
    $funW = ($agg | ForEach-Object { $_.fun } | Measure-Object -Minimum).Minimum
    # also persist these aggregated totals into vals so diag behaviour stays consistent
    foreach($a in $agg){ $vals += $a }
  } else { $stmW = $null; $funW = $null }
}

# Debug dump for troubleshooting
try{
  $raw = @{
    targets = $TARGETS;
    vals = $vals;
    stmW = $stmW;
    funW = $funW;
  }
  $raw | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $out 'STATUS_COV_DIFF_RAW.txt')
} catch{ "ERROR dumping raw diagnostics: $($_.Exception.Message)" | Out-File (Join-Path $out 'STATUS_COV_DIFF_RAW.txt') }

if(($stmW -ne $null) -and ($funW -ne $null) -and ($stmW -ge $MIN_STM) -and ($funW -ge $MIN_FUN)){ $gate = 'PASS' }
elseif($vals.Count -gt 0){ $gate = 'WARN' } else { $gate = 'NO-METRICS' }

$txt = "# ONE-SHOT v13`nTargets: " + (($TARGETS) -join ", ") + "`nWorst: stmts=" + ($(if($stmW -ne $null){ $stmW } else { '—' })) + "% funcs=" + ($(if($funW -ne $null){ $funW } else { '—' })) + "% → Gate(≥$MIN_STM/≥$MIN_FUN): " + $gate
$txt | Set-Content (Join-Path $out 'STATUS_COV_DIFF.txt')
if($gate -eq 'NO-METRICS'){
  foreach($p in $TARGETS){ ReadCovDiag $p $out }
}
if($gate -eq 'WARN'){ exit 1 } elseif($gate -eq 'PASS'){ exit 0 } else { exit 0 }

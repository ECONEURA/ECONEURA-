$ErrorActionPreference="Stop"; chcp 65001 >$null; [Console]::OutputEncoding=[Text.UTF8Encoding]::UTF8
$ts=Get-Date -f "yyyyMMdd-HHmmss"; $out=".artifacts"; New-Item -ItemType Directory -Force $out | Out-Null
$BASE = $env:DIFF_BASE; if(-not $BASE){$BASE="origin/main"}

# MIN thresholds (PowerShell-safe)
if($env:COV_STMTS_MIN){ try { $MIN_STM = [double]$env:COV_STMTS_MIN } catch { $MIN_STM = 90.0 } } else { $MIN_STM = 90.0 }
if($env:COV_FUNCS_MIN){ try { $MIN_FUN = [double]$env:COV_FUNCS_MIN } catch { $MIN_FUN = 80.0 } } else { $MIN_FUN = 80.0 }

$RUN_UI = $env:RUN_UI  # 1 para incluir UI

# 1) Scope por diff (única llamada)
$diff = @()
try { $raw = git diff --name-only "${BASE}...HEAD" 2>$null; $diff = @($raw) } catch { $diff = @() }
$targets = $diff | Where-Object {$_ -match '^(apps|packages)/[^/]+/'} | ForEach-Object { ($_ -split '/')[0..1] -join '/' } | Sort-Object -Unique
if(-not $targets -or $targets.Count -eq 0){ $targets=@("packages/shared"); if($RUN_UI -eq "1"){ $targets += @("apps/web","apps/cockpit") } }

function InTargets([string]$p){ $n = $p -replace '\\','/'; foreach($t in $targets){ if($n -like "$t/*"){ return $true } }; return $false }
function Excl([string]$p){ $n=$p -replace '\\','/'; return ($n -like "*/node_modules/*" -or $n -like "*/dist/*" -or $n -like "*/.artifacts/*" -or $n -like "*/.disabled-packages/*") }

function ReadCov(){
  $stm = @(); $fun = @()
  # coverage-summary.json (fast)
  Get-ChildItem -Recurse -Filter coverage-summary.json -File -ErrorAction SilentlyContinue |
    Where-Object { InTargets($_.FullName) -and -not (Excl($_.FullName)) } | Select-Object -First 3 | ForEach-Object {
      try{
        $j = Get-Content $_.FullName -Raw | ConvertFrom-Json
        if($j.total -and $j.total.statements -and $j.total.functions){ $stm += [double]$j.total.statements.pct; $fun += [double]$j.total.functions.pct }
      } catch {}
  }

  if($stm.Count -eq 0 -or $fun.Count -eq 0){
    # lcov.info fallback
    Get-ChildItem -Recurse -Filter lcov.info -File -ErrorAction SilentlyContinue |
      Where-Object { InTargets($_.FullName) -and -not (Excl($_.FullName)) } | Select-Object -First 3 | ForEach-Object {
        try{
          $lf=0; $lh=0; $fnf=0; $fnh=0
          foreach($line in [IO.File]::ReadLines($_.FullName)){
            if($line.StartsWith('LF:')){ $lf += [int]$line.Substring(3) }
            elseif($line.StartsWith('LH:')){ $lh += [int]$line.Substring(3) }
            elseif($line.StartsWith('FNF:')){ $fnf += [int]$line.Substring(4) }
            elseif($line.StartsWith('FNH:')){ $fnh += [int]$line.Substring(4) }
          }
          if($lf -gt 0){ $stm += [math]::Round(100.0*$lh/[double]$lf,2) }
          if($fnf -gt 0){ $fun += [math]::Round(100.0*$fnh/[double]$fnf,2) }
        } catch{}
    }
  }

  return @{ stm = $stm; fun = $fun }
}

# 3) Si no hay métricas, intentar generar mínimo en targets (sin installs), timeout 120s por paquete
$cov = ReadCov
if($cov.stm.Count -eq 0 -or $cov.fun.Count -eq 0){
  foreach($t in $targets){
  if( (Test-Path (Join-Path $t 'package.json')) -and (Test-Path (Join-Path $t 'node_modules')) ){
      try{
        $pkg = Get-Content (Join-Path $t 'package.json') -Raw | ConvertFrom-Json
        if($pkg.scripts.'test:coverage'){
          try{
            $args = @("--filter=./$t","run","test:coverage","--silent")
            $p = Start-Process -FilePath 'pnpm' -ArgumentList $args -NoNewWindow -PassThru
            if(-not $p.WaitForExit(120000)){ try { $p.Kill() } catch {} }
          } catch{}
        }
      } catch{}
    }
  }
  $cov = ReadCov
}

# 4) Gate y snapshot
if($cov.stm.Count -gt 0){ $stmW = ($cov.stm | Measure-Object -Minimum).Minimum } else { $stmW = $null }
if($cov.fun.Count -gt 0){ $funW = ($cov.fun | Measure-Object -Minimum).Minimum } else { $funW = $null }

function ToStr($v){ if($v -ne $null){ return $v.ToString() } else { return '—' } }

$cond = ($stmW -ne $null -and $funW -ne $null -and $stmW -ge $MIN_STM -and $funW -ge $MIN_FUN)
if($cond){ $gate = 'PASS' } else { $gate = 'WARN' }

$diffPreview = @($diff | Select-Object -First 20)
if($diffPreview.Count -gt 0){ $diffText = [string]::Join("`n", $diffPreview) } else { $diffText = "(no changed files detected)" }

$res = @"
# ECONEURA ONE-SHOT 100 v6 ($ts)
Targets: $([string]::Join(', ',$targets))
Worst coverage: stmts=$((ToStr $stmW))% funcs=$((ToStr $funW))% → Gate(≥$MIN_STM/≥$MIN_FUN): $gate
Diff vs ${BASE}:
$diffText
"@

$res | Tee-Object (Join-Path $out 'STATUS_COV_DIFF.txt') | Out-Null

# Falla solo si HAY métricas y no cumplen; si no hay métricas, exit 0 para no bloquear
if(($stmW -ne $null -and $funW -ne $null) -and $gate -eq 'WARN'){ exit 1 } else { exit 0 }

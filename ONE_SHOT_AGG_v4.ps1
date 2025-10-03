$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
chcp 65001 >$null; [Console]::OutputEncoding=[Text.UTF8Encoding]::UTF8
$ts=Get-Date -f "yyyyMMdd-HHmmss"
$out=".artifacts"; New-Item -ItemType Directory -Force -Path $out | Out-Null

$BASE=$env:DIFF_BASE; if(-not $BASE){$BASE="origin/main"}

# MIN thresholds (safe PowerShell assignments)
if($env:COV_STMTS_MIN){ try { $MIN_STM = [double]$env:COV_STMTS_MIN } catch { $MIN_STM = 90.0 } } else { $MIN_STM = 90.0 }
if($env:COV_FUNCS_MIN){ try { $MIN_FUN = [double]$env:COV_FUNCS_MIN } catch { $MIN_FUN = 80.0 } } else { $MIN_FUN = 80.0 }

$SKIP = $env:SKIP_GATE

# 1) Scope por diff (única llamada)
$diff = @()
try { $diff = git diff --name-only "${BASE}...HEAD" 2>$null } catch { $diff = @() }
$diff = @($diff)
$targets = $diff | Where-Object { $_ -match '^(apps|packages)/[^/]+/' } | ForEach-Object { ($_ -split '/')[0..1] -join '/' } | Sort-Object -Unique
if(-not $targets -or $targets.Count -eq 0){ $targets=@("packages/shared","apps/web","apps/cockpit") }

function Excl($p){
  $n = $p -replace '\\','/'
  return ($n -like '*/node_modules/*' -or $n -like '*/dist/*' -or $n -like '*/.artifacts/*' -or $n -like '*/.disabled-packages/*')
}

# 2) Métricas: primero coverage-summary.json (hasta 3), luego lcov.info (hasta 3), lectura en streaming
$stm = @(); $fun = @()

foreach($t in $targets){
  if(-not (Test-Path $t)) { continue }
  try{
    Get-ChildItem -Path $t -Recurse -Filter coverage-summary.json -File -ErrorAction SilentlyContinue | Where-Object { -not (Excl($_.FullName)) } | Select-Object -First 3 | ForEach-Object {
      try{
        $j = Get-Content $_.FullName -Raw | ConvertFrom-Json
        if($j.total -and $j.total.statements -and $j.total.functions){
          $stm += [double]$j.total.statements.pct
          $fun += [double]$j.total.functions.pct
        }
      } catch {}
    }
  } catch {}
}

if($stm.Count -eq 0 -or $fun.Count -eq 0){
  foreach($t in $targets){
    if(-not (Test-Path $t)) { continue }
    try{
      Get-ChildItem -Path $t -Recurse -Filter lcov.info -File -ErrorAction SilentlyContinue | Where-Object { -not (Excl($_.FullName)) } | Select-Object -First 3 | ForEach-Object {
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
        } catch {}
      }
    } catch {}
  }
}

# 3) Peor métrica y gate
$stmW = $null; $funW = $null
if($stm.Count -gt 0){ $stmW = ($stm | Measure-Object -Minimum).Minimum }
if($fun.Count -gt 0){ $funW = ($fun | Measure-Object -Minimum).Minimum }
$cond = ($stmW -ne $null -and $funW -ne $null -and $stmW -ge $MIN_STM -and $funW -ge $MIN_FUN)
if($cond){ $gate = 'PASS' } else { $gate = 'WARN' }

# 4) Snapshot corto
function ToStr($v){ if($v -ne $null){ return $v.ToString() } else { return '—' } }
$diffPreview = @($diff | Select-Object -First 20)
if($diffPreview.Count -gt 0){ $diffText = [string]::Join("`n", $diffPreview) } else { $diffText = "(no changed files detected)" }

$res = @"
# ECONEURA ONE-SHOT AGG v4 ($ts)
Targets: $([string]::Join(', ',$targets))
$([string]::Format("Worst coverage: stmts={0}% funcs={1}% → Gate(≥{2}/≥{3}): {4}", (ToStr $stmW), (ToStr $funW), $MIN_STM, $MIN_FUN, $gate))
Diff vs ${BASE}:
$diffText
"@

$res | Tee-Object "$out\STATUS_COV_DIFF.txt" | Out-Null

# 5) Exit code: sólo falla si hay métricas y no se cumple la puerta, y SKIP no está seteado
if(-not $SKIP -and $gate -eq 'WARN' -and ($stm.Count -gt 0 -or $fun.Count -gt 0)) { exit 1 } else { exit 0 }

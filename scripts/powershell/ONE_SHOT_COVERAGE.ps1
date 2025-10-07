# ECONEURA ONE-SHOT: fix filtros/UTF8, coverage mínima, snapshot y gates
$ErrorActionPreference="Stop"; Set-StrictMode -Version Latest
chcp 65001 >$null; [Console]::OutputEncoding=[Text.UTF8Encoding]::UTF8
$ts=Get-Date -f "yyyyMMdd-HHmmss"; $out=".artifacts"; ni $out -Force -ItemType Directory|Out-Null
$BASE=${env:DIFF_BASE}; if(-not $BASE){$BASE="origin/main"}
$SKIP = $false
if($env:SKIP_GATE -and $env:SKIP_GATE -ne '0'){ $SKIP = $true }

# thresholds (PowerShell-friendly)
if($env:COV_STMTS_MIN){ try{ $MIN_STM = [double]$env:COV_STMTS_MIN } catch { $MIN_STM = 90 } } else { $MIN_STM = 90 }
if($env:COV_FUNCS_MIN){ try{ $MIN_FUN = [double]$env:COV_FUNCS_MIN } catch { $MIN_FUN = 80 } } else { $MIN_FUN = 80 }
$targets=@("apps/web","apps/cockpit","packages/shared")

function HasScript($p,$s){ try{ ((Get-Content "$p\package.json" -Raw|ConvertFrom-Json).scripts.$s) -ne $null }catch{$false} }
function ExecTO($cmd,$sec,$log){ $psi=New-Object System.Diagnostics.ProcessStartInfo -Property @{FileName="cmd";Arguments="/c $cmd";RedirectStandardOutput=$true;RedirectStandardError=$true;UseShellExecute=$false;CreateNoWindow=$true}
 $p=New-Object System.Diagnostics.Process; $p.StartInfo=$psi; [void]$p.Start()
 if(-not $p.WaitForExit([int]$sec*1000)){try{$p.Kill()}catch{}; Add-Content $log "TIMEOUT $cmd"; return 124}
 Add-Content $log $p.StandardOutput.ReadToEnd(); Add-Content $log $p.StandardError.ReadToEnd(); return $p.ExitCode }

# 1) Diff-scope: si hay cambios, prioriza sólo esos paquetes
# Build the range string to avoid PowerShell parsing the '...' as the range operator
$range = "$BASE...HEAD"
$diff = git diff --name-only $range 2>$null
$diffPkgs = $diff | ? {$_ -match '^(apps|packages)/[^/]+/'} | % { ($_ -split '/')[0..1] -join '/' } | sort -Unique
if($diffPkgs){ $targets = $diffPkgs }

# 2) Generar coverage SOLO donde aporta (node_modules + script), con timeout corto
$ran=@()
foreach($t in $targets){
  if(-not (Test-Path "$t/package.json")){ continue }
  if(-not (Test-Path "$t/node_modules")){ continue }
  if(-not (HasScript $t "test:coverage")){ continue }
  $log="$out\cov-$($t -replace '/','-')-$ts.txt"
  $rc=ExecTO "pnpm --filter ""./$t"" run test:coverage --silent" 180 $log
  if($rc -eq 0){ $ran+=$t } else { Add-Content $log "WARN: coverage fail → continúo" }
}

# 3) Evaluar peor coverage disponible
$covs=Get-ChildItem -Recurse -Filter coverage-summary.json -ErrorAction SilentlyContinue
$stm=$null; $fun=$null
if($covs){
  $ws=101.0;$wf=101.0
  foreach($c in $covs){ $j=Get-Content $c.FullName -Raw|ConvertFrom-Json; $ws=[Math]::Min($ws,[double]$j.total.statements.pct); $wf=[Math]::Min($wf,[double]$j.total.functions.pct) }
  $stm=[math]::Round($ws,2); $fun=[math]::Round($wf,2)
}

# 4) Snapshot corto + gate
$gate = 'WARN'
if(($stm -ne $null) -and ($fun -ne $null) -and ($stm -ge $MIN_STM) -and ($fun -ge $MIN_FUN)){
  $gate = 'PASS'
}

if($stm -ne $null){ $stmDisplay = $stm } else { $stmDisplay = '—' }
if($fun -ne $null){ $funDisplay = $fun } else { $funDisplay = '—' }

# Safely prepare diff lines
$diffLines = @()
if($diff){
  if($diff -is [string]){ $diffLines = $diff -split "`n" | Select-Object -First 20 } else { $diffLines = @($diff | Select-Object -First 20) }
}
$diffText = if($diffLines -and $diffLines.Count -gt 0){ [string]::Join("`n", $diffLines) } else { 'sin cambios' }

$res = "# ECONEURA ONE-SHOT ($ts)`n"
$res += "Scope probado: $([string]::Join(', ',$ran))`n"
$res += "Peor coverage: stmts=${stmDisplay}% funcs=${funDisplay}% → Gate(≥${MIN_STM}/≥${MIN_FUN}): ${gate}`n"
$res += "Diff vs ${BASE}:`n${diffText}`n"

$res | Tee-Object (Join-Path $out 'STATUS_COV_DIFF.txt') | Out-Null

if(-not $SKIP -and $gate -eq 'WARN'){
  Write-Host "GATE FAIL: stm=$stmDisplay fun=$funDisplay (need ≥ $MIN_STM / ≥ $MIN_FUN)"
  exit 1
} else {
  Write-Host "GATE PASS or SKIPPED: stm=$stmDisplay fun=$funDisplay"
  exit 0
}

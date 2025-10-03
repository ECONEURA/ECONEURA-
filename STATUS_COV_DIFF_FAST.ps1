$ErrorActionPreference="Stop"; Set-StrictMode -Version Latest
$ts=Get-Date -Format "yyyyMMdd-HHmmss"; $out=".artifacts"; New-Item -ItemType Directory -Force -Path $out | Out-Null
$BASE=${env:DIFF_BASE}; if(-not $BASE){$BASE="origin/main"}
$SINCE=(Get-Date).AddDays(-90).ToString("yyyy-MM-dd")

# safe env defaults (no ?? operator)
if($env:COV_STMTS_MIN){ try{ $MIN_STM=[double]$env:COV_STMTS_MIN } catch { $MIN_STM=90.0 } } else { $MIN_STM=90.0 }
if($env:COV_FUNCS_MIN){ try{ $MIN_FUN=[double]$env:COV_FUNCS_MIN } catch { $MIN_FUN=80.0 } } else { $MIN_FUN=80.0 }

$MAX_SEC=${env:STEP_TIMEOUT_SEC}; if(-not $MAX_SEC){$MAX_SEC=180}
$ENV:CI="true"; $ENV:VITEST_MAX_THREADS="2"

$ErrorActionPreference="Stop"; Set-StrictMode -Version Latest
$ts=Get-Date -Format "yyyyMMdd-HHmmss"; $out=".artifacts"; ni $out -Force -ItemType Directory | Out-Null
$BASE=${env:DIFF_BASE}; if(-not $BASE){$BASE="origin/main"}

# Umbrales (compatibles con PowerShell)
if($env:COV_STMTS_MIN){ try{ $MIN_STM=[double]$env:COV_STMTS_MIN } catch { $MIN_STM=90 } } else { $MIN_STM=90 }
if($env:COV_FUNCS_MIN){ try{ $MIN_FUN=[double]$env:COV_FUNCS_MIN } catch { $MIN_FUN=80 } } else { $MIN_FUN=80 }
$SKIP_GATE=$env:SKIP_GATE
$ENV:CI="true"; $ENV:VITEST_MAX_THREADS="2"

function HasScript($p,$s){ try{ $pkg = Get-Content (Join-Path $p 'package.json') -Raw | ConvertFrom-Json; return ($pkg.scripts -and $pkg.scripts.$s) } catch { return $false } }
function ExecTO($cmd,$sec,$log){
  $psi=New-Object System.Diagnostics.ProcessStartInfo -Property @{FileName="cmd";Arguments="/c $cmd";RedirectStandardOutput=$true;RedirectStandardError=$true;UseShellExecute=$false;CreateNoWindow=$true}
  $p=New-Object System.Diagnostics.Process; $p.StartInfo=$psi; [void]$p.Start()
  if(-not $p.WaitForExit([int]$sec*1000)){ try{$p.Kill()}catch{}; Add-Content $log "TIMEOUT $cmd"; return 124 }
  Add-Content $log $p.StandardOutput.ReadToEnd(); Add-Content $log $p.StandardError.ReadToEnd(); return $p.ExitCode
}

# 1) Scope por diff (fallback a web/cockpit/shared)
$diff = git diff --name-only "${BASE}...HEAD" 2>$null
$targets = $diff | Where-Object {$_ -match '^(apps|packages)/[^/]+/'} | ForEach-Object { ($_ -split '/')[0..1] -join '/' } | Sort-Object -Unique
if(-not $targets){ $targets=@("apps/web","apps/cockpit","packages/shared") }

# 2) Coverage sólo donde existe script y node_modules (sin installs)
$ran=@()
foreach($t in $targets){
  if( -not (Test-Path (Join-Path $t 'package.json'))){ continue }
  if( -not (Test-Path (Join-Path $t 'node_modules'))){ continue }
  if( -not (HasScript $t "test:coverage")){ continue }
  $log=Join-Path $out ("cov-{0}-{1}.txt" -f ($t -replace '/','-'), $ts)
  $rc=ExecTO ("pnpm --filter $t run test:coverage --silent") 180 $log
  if($rc -ne 0){ Write-Host "FAIL tests: $t -> $log"; if(-not $SKIP_GATE){ exit 1 } }
  $ran+=$t
}

# 3) Evaluar peor coverage (si hay summaries)
$covs=Get-ChildItem -Recurse -Filter coverage-summary.json -ErrorAction SilentlyContinue
$stm=$null; $fun=$null
if($covs){ $ws=101.0; $wf=101.0; foreach($c in $covs){ $j=Get-Content $c.FullName -Raw|ConvertFrom-Json; $ws=[Math]::Min($ws,[double]$j.total.statements.pct); $wf=[Math]::Min($wf,[double]$j.total.functions.pct) }; $stm=[math]::Round($ws,2); $fun=[math]::Round($wf,2) }

# 4) Snapshot corto
$res=@()
$res += "# COVERAGE+SNAPSHOT ($ts)"
$res += "Scope probado: $([string]::Join(', ',$ran))"
$stmDisplay = if($stm -ne $null){ $stm } else { '—' }
$funDisplay = if($fun -ne $null){ $fun } else { '—' }
$res += "Peor coverage: stmts=${stmDisplay}% funcs=${funDisplay}%  Gate(≥${MIN_STM}/≥${MIN_FUN})"
$diffList = @(@($diff) | Where-Object { $_ -and $_ -ne "" } | Select-Object -First 20)
$diffDisplay = if($diffList.Count -gt 0){ [string]::Join(', ',$diffList) } else { 'sin cambios' }
$res += "Diff vs ${BASE}: ${diffDisplay}"
$res -join "`r`n" | Tee-Object (Join-Path $out 'STATUS_COV_DIFF.txt') | Out-Null

# 5) Gate
if(-not $SKIP_GATE -and ($stm -eq $null -or $fun -eq $null -or $stm -lt $MIN_STM -or $fun -lt $MIN_FUN)){ exit 1 } else { exit 0 }

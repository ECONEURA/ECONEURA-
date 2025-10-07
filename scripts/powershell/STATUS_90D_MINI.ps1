$ErrorActionPreference="SilentlyContinue"
$ts=Get-Date -Format "yyyyMMdd-HHmmss"; $out=".artifacts"; New-Item -ItemType Directory -Force $out|Out-Null
$BASE=${env:DIFF_BASE}; if(-not $BASE){$BASE="origin/main"}; $SINCE=(Get-Date).AddDays(-90).ToString("yyyy-MM-dd")
# defaults for coverage gates
$MIN_STM = 90.0; if ($env:COV_STMTS_MIN) { try { $MIN_STM = [double]$env:COV_STMTS_MIN } catch { } }
$MIN_FUN = 80.0; if ($env:COV_FUNCS_MIN) { try { $MIN_FUN = [double]$env:COV_FUNCS_MIN } catch { } }

# Cobertura: busca el último coverage-summary.json en todo el repo
$cov=Get-ChildItem -Recurse -Filter coverage-summary.json -ErrorAction Ignore |
     Sort-Object LastWriteTime -Desc | Select-Object -First 1
if($cov){
  $j=Get-Content $cov.FullName -Raw | ConvertFrom-Json
  $stm=[math]::Round($j.total.statements.pct,2)
  $fun=[math]::Round($j.total.functions.pct,2)
}else{ $stm=$null; $fun=$null }

# Git: commits, autores, churn rápido (capado)
$commits=(git rev-list --count --since=$SINCE HEAD 2>$null)
$authors=(git shortlog -sne --since=$SINCE 2>$null | measure-object).Count
$stat=git log --since=$SINCE --numstat --pretty=tformat: --max-count=1000 2>$null
$adds=0; $dels=0
foreach($l in $stat){ if($l -match "^\d+\s+\d+"){ $p=$l -split '\s+'; $adds+=[int]$p[0]; $dels+=[int]$p[1] } }

# Diff actual (safe range)
try { git rev-parse --verify $BASE 2>$null | Out-Null; $diffRange = "$BASE..HEAD" } catch { $diffRange = "HEAD" }
$diffList = git diff --name-only $diffRange 2>$null | Select-Object -First 15
if(-not $diffList){ $diff="sin cambios vs $BASE" } else { $diff = $diffList -join "; " }

# Gate
$gate = if($stm -ne $null -and $fun -ne $null -and $stm -ge $MIN_STM -and $fun -ge $MIN_FUN) {"PASS"} else {"WARN"}

# Resumen en consola + archivo
$res=@"
# ECONEURA STATUS 90D ($ts)
Coverage: stmts=$stm% funcs=$fun% → Gate(≥$MIN_STM/≥$MIN_FUN): $gate
Commits90d=$commits  |  Autores=$authors  |  Churn=+$adds/-$dels
Diff vs ${BASE}: $diff
"@
$res | Tee-Object "$out\STATUS_90D.txt"
if($gate -eq "WARN"){ exit 1 } else { exit 0 }
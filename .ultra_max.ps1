$ErrorActionPreference="Stop"; Set-StrictMode -Version Latest
$ts=Get-Date -Format "yyyyMMdd-HHmmss"; $pOut=".artifacts"; New-Item -Type Directory -Force $pOut|Out-Null
$env:CI="true"; $env:VITEST_MAX_THREADS="2"; $env:TSC_NONPOLLING_WATCHER="true"
$MIN_STM = 90.0; if ($env:COV_STMTS_MIN) { try { $MIN_STM = [double]$env:COV_STMTS_MIN } catch { } }
$MIN_FUN = 80.0; if ($env:COV_FUNCS_MIN) { try { $MIN_FUN = [double]$env:COV_FUNCS_MIN } catch { } }
$MIN_DIFF = 80.0; if ($env:COV_CHANGED_MIN) { try { $MIN_DIFF = [double]$env:COV_CHANGED_MIN } catch { } }
$BASE=${env:DIFF_BASE}; if(-not $BASE){$BASE="origin/main"}
$PKGS=@("apps\web","apps\cockpit")

function HasScript($pkg,$name){ try{ ((Get-Content "$pkg\package.json" -Raw|ConvertFrom-Json).scripts.$name) -ne $null }catch{$false} }
function Run($cmd,$log){ 
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'cmd'
  $psi.Arguments = '/c ' + $cmd
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  $p.Start() | Out-Null
  $so = $p.StandardOutput.ReadToEnd(); $se = $p.StandardError.ReadToEnd()
  $p.WaitForExit(600000) | Out-Null
  Add-Content $log $so; Add-Content $log $se; if($p.ExitCode -ne 0){ throw "FAIL: $cmd → $log" }
}

# install (silencioso)
Run "pnpm -w i --prefer-frozen-lockfile --silent" "$pOut\install-$ts.txt"

# diff-scope
try { git rev-parse --verify $BASE 2>$null | Out-Null; $diffRange = "$BASE..HEAD" } catch { $diffRange = "HEAD" }
$changed = git diff --name-only $diffRange 2>$null
$touchWeb = ($changed | Select-String '^apps/web/') -ne $null
$touchCk  = ($changed | Select-String '^apps/cockpit/') -ne $null
if(-not($touchWeb -or $touchCk)){ $touchWeb=$true; $touchCk=$true } # chequeo completo si no hay diff

# pipeline por paquete (fail-fast)
foreach($pkg in $PKGS){
  $log="$pOut\$($pkg.Replace('\','-'))-$ts.txt"
  if (HasScript $pkg "lint") { $lint = "pnpm --filter $pkg run lint --silent" } else { $lint = "pnpm --filter $pkg exec eslint src --max-warnings=0" }
  if (HasScript $pkg "typecheck") { $type = "pnpm --filter $pkg run typecheck --silent" } else { $type = "pnpm --filter $pkg exec tsc -p tsconfig.json --noEmit" }
  if (HasScript $pkg "test:coverage") { $test = "pnpm --filter $pkg run test:coverage --silent" } else { $test = $null }
  if (HasScript $pkg "build") { $bld = "pnpm --filter $pkg run build --silent" } else { $bld = $null }

  Run $lint $log; Run $type $log
  if(($pkg -eq "apps\web" -and $touchWeb) -or ($pkg -eq "apps\cockpit" -and $touchCk)){ if($test){ Run $test $log } }
  if($bld){ Run $bld $log }
}

# changed-files ≥80% para web/cockpit si hay tests con cobertura
function DiffCoverageOk($pkg){
  $cov=Get-ChildItem -Recurse -Path $pkg -Filter coverage-final.json -ErrorAction SilentlyContinue|Sort LastWriteTime -Desc|Select -First 1
  if(-not $cov){ return $true }
  $j=Get-Content $cov.FullName -Raw|ConvertFrom-Json
  $files=$changed | Where-Object { $_ -like "$($pkg.Replace('\\','/'))/*" } | ForEach-Object { $_.Replace('/','\\') }
  if(-not $files){ return $true }
  $covered=0;$total=0
  foreach($f in $files){ $k=$j.$f; if($k){ $total += [int]$k.statements.total; $covered += [int]$k.statements.covered } }
  if($total -eq 0){ return $true }
  return ((100.0*$covered/$total) -ge $MIN_DIFF)
}
if($touchWeb  -and -not (DiffCoverageOk "apps\web"))     { throw "FAIL: changed-files coverage < $MIN_DIFF% (web)" }
if($touchCk   -and -not (DiffCoverageOk "apps\cockpit")) { throw "FAIL: changed-files coverage < $MIN_DIFF% (cockpit)" }

# gates globales: peor summary encontrado
$covs=Get-ChildItem -Recurse -Filter coverage-summary.json -ErrorAction SilentlyContinue
if($covs){
  $worst=@{stm=101.0; fn=101.0}
  foreach($c in $covs){ $j=Get-Content $c.FullName -Raw|ConvertFrom-Json; $worst.stm=[Math]::Min($worst.stm,[double]$j.total.statements.pct); $worst.fn=[Math]::Min($worst.fn,[double]$j.total.functions.pct) }
  if($worst.stm -lt $MIN_STM -or $worst.fn -lt $MIN_FUN){ throw ("FAIL: coverage stmts={0}% funcs={1}% (<{2}/{3})" -f $worst.stm,$worst.fn,$MIN_STM,$MIN_FUN) }
}

 # smoke web sólo si hubo cambios y existe index.html
 if($touchWeb -and (Test-Path "apps\web\dist\index.html")){
  $previewLog = "$pOut\preview-web-$ts.log"
  # Try pnpm dlx http-server first, fallback to npx if pnpm dlx missing
  $cmd = "pnpm dlx http-server `"apps/web/dist`" -p 5173"
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'cmd'
  $psi.Arguments = '/c ' + $cmd
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  $p.Start() | Out-Null
  # read output asynchronously into the preview log periodically
  Start-Sleep -Milliseconds 300
  $ready = $false
  $attempts = 0
  while ($attempts -lt 10 -and -not $ready) {
    Start-Sleep -Milliseconds 800
    try {
      $r = Invoke-WebRequest "http://127.0.0.1:5173" -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
      if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    $attempts++
  }
  # collect process output to preview log
  try {
    if (Test-Path $previewLog) { Remove-Item $previewLog -ErrorAction SilentlyContinue }
    $so = $p.StandardOutput.ReadToEnd(); $se = $p.StandardError.ReadToEnd()
    "$so`n$se" | Out-File -FilePath $previewLog -Encoding utf8
  } catch { }
  if (-not $ready) {
    if ($p) { Stop-Process $p.Id -Force -ErrorAction SilentlyContinue }
    throw "FAIL: web/smoke (no response on http://127.0.0.1:5173) -> see $previewLog"
  }
  if ($p) { Stop-Process $p.Id -Force -ErrorAction SilentlyContinue }
 }

"PASS: rápido, scope por diff, gates reales (stmts>=$MIN_STM funcs>=$MIN_FUN changed>=$MIN_DIFF)"
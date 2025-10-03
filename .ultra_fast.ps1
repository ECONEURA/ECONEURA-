$ErrorActionPreference="Stop"; Set-StrictMode -Version Latest
$ProgressPreference="SilentlyContinue"; $ts=Get-Date -Format "yyyyMMdd-HHmmss"
ni .artifacts -Force -ItemType Directory|Out-Null
$env:CI="true"; $env:VITEST_MAX_THREADS="2"; $env:TSC_NONPOLLING_WATCHER="true"
$web="apps\web"; $ck="apps\cockpit"; $base=${env:DIFF_BASE}; if(-not $base){$base="origin/main"}

function Has($p,$s){
  try{
    $pj = Get-Content "$p\package.json" -Raw | ConvertFrom-Json
    if ($pj.scripts) { return ($pj.scripts.PSObject.Properties.Name -contains $s) } else { return $false }
  } catch { return $false }
}
function Run($cmd,$log){
  # Use Start-Process to run cmd /c and redirect output to log file
  $si = New-Object System.Diagnostics.ProcessStartInfo
  $si.FileName = 'cmd.exe'
  $si.Arguments = '/c ' + $cmd
  $si.RedirectStandardOutput = $true
  $si.RedirectStandardError = $true
  $si.UseShellExecute = $false
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $si
  $p.Start() | Out-Null
  $out = $p.StandardOutput.ReadToEnd()
  $err = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  $out + $err | Out-File -FilePath $log -Encoding utf8
  if ($p.ExitCode -ne 0) { throw "Command failed with exitcode $($p.ExitCode)" }
}

# 0) Install (silencioso con veredicto)
Run "pnpm -w i --prefer-frozen-lockfile --silent" ".artifacts\install-$ts.txt"

# 1) Cambios: si no hay diff en web/cockpit, saltar smoke y tests (solo lint/type)
try {
  git rev-parse --verify $base 2>$null | Out-Null
  $diffRange = "$base..HEAD"
} catch { $diffRange = "HEAD" }
$diffOutput = git diff --name-only $diffRange 2>$null | Select-String -Pattern '^apps/(web|cockpit)/'
if ($diffOutput) { $changed = ($diffOutput | Measure-Object).Count -gt 0 } else { $changed = $false }

# 2) LINT + TYPE + TEST + BUILD (fail-fast, por paquete, con fallback)
# Build steps array in a PowerShell-friendly way (avoid ternary operators)
$steps = @()

# web lint
if (Has $web "lint") { $cmd = "pnpm --filter $web run lint --silent" } else { $cmd = "pnpm --filter $web exec eslint src --max-warnings=0" }
$steps += @{pkg=$web; name="lint"; cmd=$cmd}
# web type
if (Has $web "typecheck") { $cmd = "pnpm --filter $web run typecheck --silent" } else { $cmd = "pnpm --filter $web exec tsc -p tsconfig.json --noEmit" }
$steps += @{pkg=$web; name="type"; cmd=$cmd}
# web test (only if test script exists and changed)
if ((Has $web "test:coverage") -and $changed) { $steps += @{pkg=$web; name="test"; cmd="pnpm --filter $web run test:coverage --silent"} }
# web build
$steps += @{pkg=$web; name="build"; cmd="pnpm --filter $web run build --silent"}

# cockpit lint
if (Has $ck "lint") { $cmd = "pnpm --filter $ck run lint --silent" } else { $cmd = "pnpm --filter $ck exec eslint src --max-warnings=0" }
$steps += @{pkg=$ck; name="lint"; cmd=$cmd}
# cockpit type
if (Has $ck "typecheck") { $cmd = "pnpm --filter $ck run typecheck --silent" } else { $cmd = "pnpm --filter $ck exec tsc -p tsconfig.json --noEmit" }
$steps += @{pkg=$ck; name="type"; cmd=$cmd}
# cockpit test (only if test script exists and changed)
if ((Has $ck "test:coverage") -and $changed) { $steps += @{pkg=$ck; name="test"; cmd="pnpm --filter $ck run test:coverage --silent"} }
# cockpit build (only if build script exists)
if (Has $ck "build") { $steps += @{pkg=$ck; name="build"; cmd="pnpm --filter $ck run build --silent"} }

foreach($s in $steps){
  if(-not $s.cmd){ continue }
  $safePkg = ($s.pkg -replace '[\\/]', '-')
  $log=".artifacts\$($safePkg)-$($s.name)-$ts.txt"
  try{ Run $s.cmd $log } catch { Write-Host "FAIL [$($s.pkg)/$($s.name)] → ver $log"; exit 1 }
}

# 3) Smoke sólo si hubo cambios y existe index.html en web
if($changed -and (Test-Path "$web\dist\index.html")){
  $p=Start-Process -PassThru -FilePath "npx" -ArgumentList "http-server `"$web\dist`" -p 5173" -WindowStyle Hidden
  Start-Sleep -Milliseconds 900
  try{ if((Invoke-WebRequest http://127.0.0.1:5173 -TimeoutSec 3 -UseBasicParsing).StatusCode -ne 200){ throw "smoke" } }
  catch{ if($p){Stop-Process $p.Id -Force}; Write-Host "FAIL [web/smoke]"; exit 2 }
  finally{ if($p){Stop-Process $p.Id -Force} }
}

# 4) Gates de cobertura: toma el peor summary encontrado
$covs=Get-ChildItem -Recurse -Filter coverage-summary.json -ErrorAction SilentlyContinue
if($covs){
  $worst=@{stm=101; fn=101}
  foreach($c in $covs){
    $j=Get-Content $c.FullName -Raw|ConvertFrom-Json
    $stm=[double]$j.total.statements.pct; $fn=[double]$j.total.functions.pct
    if($stm -lt $worst.stm){ $worst.stm=$stm } ; if($fn -lt $worst.fn){ $worst.fn=$fn }
  }
  if ($env:COV_STMTS_MIN) { try { $minStm = [double]$env:COV_STMTS_MIN } catch { $minStm = 90.0 } } else { $minStm = 90.0 }
  if ($env:COV_FUNCS_MIN) { try { $minFn = [double]$env:COV_FUNCS_MIN } catch { $minFn = 80.0 } } else { $minFn = 80.0 }
  if($worst.stm -lt $minStm -or $worst.fn -lt $minFn){ Write-Host ("FAIL [coverage] stmts={0}% funcs={1}%" -f $worst.stm,$worst.fn); exit 3 }
}

Write-Host "PASS (rápido, cockpit/web listos)"; exit 0

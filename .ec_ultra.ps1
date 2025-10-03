Set-StrictMode -Version Latest; $ErrorActionPreference="Stop"
$ts=Get-Date -Format "yyyyMMdd-HHmmss"; ni .artifacts -Force -ItemType Directory|out-null
function Start-BackgroundJob($n, $cmd) { Start-Job -Name $n -ScriptBlock { param($c) & cmd /c $c } -ArgumentList $cmd }
function Has-Script($pkg, $name) { try { ((Get-Content "$pkg\package.json" -Raw | ConvertFrom-Json).scripts.PSObject.Properties.Name -contains $name) } catch { $false } }
function Resolve-Command($pkg, $script, $fallback) { if (Has-Script $pkg $script) { "pnpm --filter $pkg run $script" } else { $fallback } }

# 0) Install (único bloqueante)
pnpm -w i --prefer-frozen-lockfile *> ".artifacts\install-$ts.txt"

# 1) Jobs en paralelo (lint/typecheck/test/build) con fallback directo
$web="apps\web"; $ck="apps\cockpit"
$jobs = @()
$jobs += Start-BackgroundJob "lint-web"      (Resolve-Command $web "lint"      "pnpm --filter $web exec eslint src --max-warnings=0")
$jobs += Start-BackgroundJob "lint-cockpit"  (Resolve-Command $ck  "lint"      "pnpm --filter $ck  exec eslint src --max-warnings=0")
$jobs += Start-BackgroundJob "type-web"      (Resolve-Command $web "typecheck" "pnpm --filter $web exec tsc -p tsconfig.json --noEmit")
$jobs += Start-BackgroundJob "type-cockpit"  (Resolve-Command $ck  "typecheck" "pnpm --filter $ck  exec tsc -p tsconfig.json --noEmit")
$jobs += Start-BackgroundJob "test-web"      (Resolve-Command $web "test:coverage" "pnpm --filter $web exec vitest run --coverage")
$jobs += Start-BackgroundJob "test-cockpit"  (Resolve-Command $ck  "test:coverage" "pnpm --filter $ck  exec vitest run --coverage")
$jobs += Start-BackgroundJob "build-web"     (Resolve-Command $web "build"     "pnpm --filter $web run build")
$jobs += Start-BackgroundJob "build-cockpit" (Resolve-Command $ck  "build"     "pnpm --filter $ck  run build")

# 2) Espera y recoge (fail-fast)
Receive-Job -Job (Wait-Job -Job $jobs) -Keep | Tee-Object ".artifacts\jobs-$ts.txt" | Out-Null
$bad=(Get-Job|? State -ne 'Completed')
if($bad){ Get-Job|Receive-Job -Keep|Out-String|Set-Content ".artifacts\fail-$ts.txt"; Write-Host "VEREDICTO: FAIL"; exit 1 }

# 3) Cobertura mínima (si existe summary)
# 3) Cobertura mínima (si existe summary)
$cov=Get-ChildItem -Recurse -Filter coverage-summary.json -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Desc | Select-Object -First 1
if ($cov) {
  $j = Get-Content $cov.FullName -Raw | ConvertFrom-Json
  $s = [double]$j.total.statements.pct
  $f = [double]$j.total.functions.pct
  # defaults
  $minStmts = 90.0
  $minFuncs = 80.0
  if ($env:COV_STMTS_MIN) { try { $minStmts = [double]$env:COV_STMTS_MIN } catch { } }
  if ($env:COV_FUNCS_MIN) { try { $minFuncs = [double]$env:COV_FUNCS_MIN } catch { } }
  if (($s -lt $minStmts) -or ($f -lt $minFuncs)) { Write-Host "VEREDICTO: FAIL (cov)"; exit 2 }
}

Write-Host "VEREDICTO: PASS"
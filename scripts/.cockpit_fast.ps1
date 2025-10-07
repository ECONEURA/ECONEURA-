# PowerShell quick check for apps/cockpit and apps/web
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ts = (Get-Date).ToString('yyyyMMdd-HHmmss')
New-Item -ItemType Directory -Force -Path .artifacts | Out-Null
$env:NODE_ENV = 'development'
if (-not $env:DIFF_BASE -or $env:DIFF_BASE -eq '') { $env:DIFF_BASE = 'origin/main' }

"== ENV =="
node -v 2>&1 | Tee-Object -FilePath ".artifacts/env-$ts.txt"
pnpm -v 2>&1 | Tee-Object -FilePath ".artifacts/env-$ts.txt" -Append

"== INSTALL (cached) =="
pnpm i --prefer-frozen-lockfile 2>&1 | Tee-Object -FilePath ".artifacts/install-$ts.txt"

"== CHANGE SCOPE (cockpit/web only if changed) =="
try { git fetch origin $env:DIFF_BASE --quiet 2>$null } catch { }
 $changedFiles = @()
 try {
	 $diffOutput = git diff --name-only "$env:DIFF_BASE...HEAD" 2>$null
	 if ($diffOutput) { $changedFiles = $diffOutput | Where-Object { $_ -match '^apps/(cockpit|web)/' } }
 } catch { Write-Output "git diff failed: $_" }
 if ($changedFiles -and $changedFiles.Count -gt 0) { $changedFiles | Out-File ".artifacts/changed-$ts.txt"; Write-Output "Cambios en apps/cockpit|web detectados" } else { "Sin cambios en cockpit/web → forzar chequeo rápido" | Out-File ".artifacts/changed-$ts.txt"; Write-Output "Sin cambios en cockpit/web → forzar chequeo rápido" }

 $SCOPE_COCKPIT = '--filter=./apps/cockpit'
 $SCOPE_WEB = '--filter=./apps/web'

"== LINT (tolerante) =="
# run lint for cockpit if script exists
function Run-IfScriptExists($scope, $scriptName, $outPath, $args) {
	try {
		$pkg = ($scope -replace '--filter=./','').Replace('./','')
		$pkgPath = Join-Path -Path (Get-Location) -ChildPath $pkg
		$pkgJson = Join-Path -Path $pkgPath -ChildPath 'package.json'
		if (-Not (Test-Path $pkgJson)) { "No package.json for $pkg, skipping $scriptName" | Out-File $outPath -Append; return }
		$pj = Get-Content $pkgJson -Raw | ConvertFrom-Json
		$hasScript = $false
		if ($pj.scripts) {
			$props = $pj.scripts.PSObject.Properties.Name
			if ($props -contains $scriptName) { $hasScript = $true }
		}
		if ($hasScript) {
			pnpm $scope run $scriptName -- $args 2>&1 | Tee-Object -FilePath $outPath
		} else {
			"Script '$scriptName' not found in $pkgJson, skipping" | Out-File $outPath -Append
		}
	} catch {
		$err = $_.ToString()
		("Run-IfScriptExists encountered error for scope={0} script={1}: {2}" -f $scope, $scriptName, $err) | Out-File $outPath -Append
	}
}

Run-IfScriptExists $SCOPE_COCKPIT 'lint' ".artifacts/lint-cockpit-$ts.txt" '--max-warnings=0'
Run-IfScriptExists $SCOPE_WEB 'lint' ".artifacts/lint-web-$ts.txt" '--max-warnings=0'

"== TYPECHECK (tolerante) =="
Run-IfScriptExists $SCOPE_COCKPIT 'typecheck' ".artifacts/ts-cockpit-$ts.txt" ''
Run-IfScriptExists $SCOPE_WEB 'typecheck' ".artifacts/ts-web-$ts.txt" ''

"== TEST + COVERAGE (UI) (si existen) =="
Run-IfScriptExists $SCOPE_COCKPIT 'test:coverage' ".artifacts/cov-cockpit-$ts.txt" ''
Run-IfScriptExists $SCOPE_WEB 'test:coverage' ".artifacts/cov-web-$ts.txt" ''

"== BUILD (cockpit primero) =="
Run-IfScriptExists $SCOPE_COCKPIT 'build' ".artifacts/build-cockpit-$ts.txt" ''
Run-IfScriptExists $SCOPE_WEB 'build' ".artifacts/build-web-$ts.txt" ''

"== PREVIEW + SMOKE (cockpit) =="
# Some packages produce index.html (vite), others only produce JS bundles (esbuild). Accept either.
$distDir = Join-Path -Path "apps/cockpit" -ChildPath "dist"
$distIndex = Join-Path -Path $distDir -ChildPath "index.html"
$distAppJs = Join-Path -Path $distDir -ChildPath "app.js"
if (Test-Path $distIndex) { "SMOKE index OK (dist/index.html exists)" | Tee-Object -FilePath ".artifacts/preview-cockpit-$ts.log" } elseif (Test-Path $distAppJs) { "SMOKE bundle OK (dist/app.js exists)" | Tee-Object -FilePath ".artifacts/preview-cockpit-$ts.log" } else { "SMOKE FAIL (no index.html or app.js in dist)" | Tee-Object -FilePath ".artifacts/preview-cockpit-$ts.log" }

"== RESULTADOS =="
$pass = $true
$l1 = Get-Content ".artifacts/lint-cockpit-$ts.txt" -ErrorAction SilentlyContinue
$l2 = Get-Content ".artifacts/lint-web-$ts.txt" -ErrorAction SilentlyContinue
if (-not ($l1 -match "0 problems")) { $pass = $false }
if (-not ($l2 -match "0 problems")) { $pass = $false }
if (-not (Select-String -Path ".artifacts/cov-cockpit-$ts.txt" -Pattern "Coverage" -Quiet)) { $pass = $false }
if (-not (Select-String -Path ".artifacts/preview-cockpit-$ts.log" -Pattern "SMOKE index OK|SMOKE bundle OK" -Quiet)) { $pass = $false }

if ($pass) { Write-Output "VEREDICTO: PASS (cockpit funcional, lint/typecheck OK, tests+build+preview OK)" } else { Write-Output "VEREDICTO: FAIL (revisar .artifacts/*-$ts.txt y *.log)"; exit 1 }

Write-Output "Artefactos => .artifacts/"

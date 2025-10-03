$ErrorActionPreference='Stop'
$all=@('packages/shared','apps/web','apps/cockpit')|?{Test-Path "$_/package.json"}
$targets=@(); foreach($p in $all){ try{$j=gc "$p/package.json" -Raw|ConvertFrom-Json; if($j.scripts.'test:coverage'){$targets+=$p}}catch{} }
if(-not $targets){$targets=@('packages/shared')}
Write-Host 'TARGETS:'
$targets|%{Write-Host " - $_" }
foreach($p in $targets){
  Write-Host '----'
  Write-Host "Running: $p"
  pnpm --dir $p run test:coverage
  if($LASTEXITCODE -ne 0){ Write-Host "EXIT:$LASTEXITCODE"; exit $LASTEXITCODE }
}
Write-Host 'ALL OK'
exit 0

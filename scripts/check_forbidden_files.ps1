param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root '..')

$forbiddenPatterns = @(
  'backups/**',
  '**/backups/**',
  '**/backup/**',
  '**/*.backup',
  '**/coverage/**/lcov.info',
  '**/coverage/**/coverage-final.json',
  # tracked lockfiles that shouldn't be committed
  '**/package-lock.json',
  '**/yarn.lock',
  '**/npm-shrinkwrap.json'
)

Write-Host "Checking repository for forbidden/generated files..."

$matches = @()
foreach($pat in $forbiddenPatterns){
  try{
    $out = & git ls-files -- $pat 2>$null
    if($out){ $matches += $out }
  } catch { }
}

$matches = $matches | Sort-Object -Unique
if($matches.Count -gt 0){
  Write-Host "Found forbidden/tracked files:" -ForegroundColor Yellow
  foreach($m in $matches){ Write-Host "  " $m }
  Write-Host "Please remove these files from the index (git rm --cached ...) or add to .gitignore as appropriate." -ForegroundColor Red
  exit 1
} else {
  Write-Host "No forbidden files found."
  exit 0
}

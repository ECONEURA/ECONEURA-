# Wrapper to run ONE_SHOT_100_v13.ps1 and return appropriate exit code and summary
param(
  [string]$ScriptPath = "ONE_SHOT_100_v13.ps1"
)
try{
  Write-Host "Running aggregator: $ScriptPath"
  powershell -NoProfile -ExecutionPolicy Bypass -File $ScriptPath
  $ec = $LASTEXITCODE
  Write-Host "Aggregator exit code: $ec"
  if(Test-Path ".artifacts\STATUS_COV_DIFF.txt"){ Get-Content ".artifacts\STATUS_COV_DIFF.txt" | Write-Host }
  exit $ec
} catch{
  Write-Host "Error running aggregator: $($_.Exception.Message)"; exit 10
}
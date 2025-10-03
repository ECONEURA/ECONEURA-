param()
Set-StrictMode -Version Latest

# enforce_coverage.ps1
# Scans coverage artifacts across workspace, computes aggregated metrics
# Supports v8 coverage-final.json, istanbul coverage-summary.json, and lcov.info (basic parsing)
# Writes .artifacts/STATUS_COV_DIFF.txt and .artifacts/STATUS_COV_DIFF_DIAG.txt
# Exits:
#   0 -> success (meets threshold)
#   1 -> failed threshold
#   2 -> no metrics found

$ErrorActionPreference = 'Stop'

function Ensure-Dir([string]$p){ if(-not (Test-Path $p)){ New-Item -ItemType Directory -Path $p | Out-Null } }

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root '..')
$artifactsDir = Join-Path $repoRoot '.artifacts'
Ensure-Dir $artifactsDir

$outSummary = Join-Path $artifactsDir 'STATUS_COV_DIFF.txt'
$outDiag = Join-Path $artifactsDir 'STATUS_COV_DIFF_DIAG.txt'

Remove-Item -ErrorAction SilentlyContinue -Force $outSummary, $outDiag

Write-Host "Scanning workspace for coverage artifacts..."

$coverageFiles = @()

# Find common coverage files under packages and apps
$patterns = @(
  'packages/**/coverage/coverage-final.json',
  'packages/**/coverage/coverage-summary.json',
  'packages/**/coverage/lcov.info',
  'packages/**/coverage/**/coverage-final.json',
  'apps/**/coverage/coverage-final.json',
  'coverage/**/coverage-final.json'
)

foreach($p in $patterns){
  $found = Get-ChildItem -Path $repoRoot -Recurse -Filter (Split-Path $p -Leaf) -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like $(Join-Path $repoRoot $p).Replace('\*\*','*') }
  if($found){ $coverageFiles += $found }
}

# also look for any coverage-summary.json and lcov.info anywhere
$coverageFiles += Get-ChildItem -Path $repoRoot -Recurse -Include 'coverage-final.json','coverage-summary.json','lcov.info' -ErrorAction SilentlyContinue | Sort-Object FullName -Unique

$coverageFiles = $coverageFiles | Sort-Object FullName -Unique

if(-not $coverageFiles -or $coverageFiles.Count -eq 0){
  "NO METRICS: No coverage artifacts found" | Out-File -FilePath $outSummary -Encoding utf8
  "NO-METRICS" | Out-File -FilePath $outDiag -Encoding utf8
  Write-Host 'No coverage artifacts found.'
  exit 2
}

Write-Host "Found $($coverageFiles.Count) coverage files"

# accumulator
$script:totalStatements = 0
$script:coveredStatements = 0
$script:totalBranches = 0
$script:coveredBranches = 0
$script:totalFunctions = 0
$script:coveredFunctions = 0

$script:perFile = @{}

function Parse-V8Json($filePath){
  try{
    $j = Get-Content $filePath -Raw | ConvertFrom-Json
  } catch {
    Write-Warning "Failed to parse JSON: $filePath -> $($_.Exception.Message)"
    return
  }
  foreach($prop in $j.PSObject.Properties){
    $name = $prop.Name
    $m = $prop.Value
    # statements
    $sCount = 0; $sCov = 0
    try{ $sCount = $m.statementMap.PSObject.Properties.Count } catch { $sCount = 0 }
    try{ $sCov = ($m.s.PSObject.Properties | Where-Object { [int]$_.Value -gt 0 } | Measure-Object).Count } catch { $sCov = 0 }
    # functions
    $fCount = 0; $fCov = 0
    try{ $fCount = $m.fnMap.PSObject.Properties.Count } catch { $fCount = 0 }
    try{ $fCov = ($m.f.PSObject.Properties | Where-Object { [int]$_.Value -gt 0 } | Measure-Object).Count } catch { $fCov = 0 }
    # branches
    $bCount = 0; $bCov = 0
    try{ $bCount = $m.branchMap.PSObject.Properties.Count } catch { $bCount = 0 }
    try{ $bCov = ($m.b.PSObject.Properties | Where-Object { [int]$_.Value -gt 0 } | Measure-Object).Count } catch { $bCov = 0 }

  $script:totalStatements += $sCount; $script:coveredStatements += $sCov
  $script:totalFunctions += $fCount; $script:coveredFunctions += $fCov
  $script:totalBranches += $bCount; $script:coveredBranches += $bCov

  $script:perFile[$name] = @{ statements=$sCount; coveredStatements=$sCov; functions=$fCount; coveredFunctions=$fCov; branches=$bCount; coveredBranches=$bCov }
  }
}

function Parse-IstanbulSummary($filePath){
  try{ $j = Get-Content $filePath -Raw | ConvertFrom-Json } catch { Write-Warning "Failed to parse JSON: $filePath"; return }
  foreach($entry in $j.PSObject.Properties){
    $name = $entry.Name
    $data = $entry.Value
    if($name -eq 'total'){ continue }
    $sCount = [int]($data.statements.total -as [int])
    $sCov = [int]($data.statements.covered -as [int])
    $fCount = [int]($data.functions.total -as [int])
    $fCov = [int]($data.functions.covered -as [int])
    $bCount = [int]($data.branches.total -as [int])
    $bCov = [int]($data.branches.covered -as [int])

  $script:totalStatements += $sCount; $script:coveredStatements += $sCov
  $script:totalFunctions += $fCount; $script:coveredFunctions += $fCov
  $script:totalBranches += $bCount; $script:coveredBranches += $bCov

  $script:perFile[$name] = @{ statements=$sCount; coveredStatements=$sCov; functions=$fCount; coveredFunctions=$fCov; branches=$bCount; coveredBranches=$bCov }
  }
}

function Parse-Lcov($filePath){
  # Very small lcov parser: sums SF..DA..BRDA blocks
  $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
  if(-not $content){ return }
  $current = $null
  $lines = $content -split "`n"
  foreach($line in $lines){
    $line = $line.Trim()
    if($line -like 'SF:*'){ $current = $line.Substring(3); if(-not $perFile.ContainsKey($current)){ $perFile[$current]=@{ statements=0; coveredStatements=0; branches=0; coveredBranches=0; functions=0; coveredFunctions=0 } } }
    elseif($line -like 'DA:*'){ # DA:<line>,<count>
      $parts = $line.Substring(3).Split(',')
      $perFile[$current].statements += 1
      if([int]$parts[1] -gt 0){ $perFile[$current].coveredStatements += 1 }
    }
    elseif($line -like 'BRDA:*'){ # BRDA:<line>,<block>,<branch>,<taken>
      $parts = $line.Substring(5).Split(',')
      $perFile[$current].branches += 1
      if($parts[3] -ne '-' -and [int]$parts[3] -gt 0){ $perFile[$current].coveredBranches += 1 }
    }
  }
  # accumulate perFile
  foreach($k in $script:perFile.Keys){
    $script:totalStatements += $script:perFile[$k].statements; $script:coveredStatements += $script:perFile[$k].coveredStatements
    $script:totalBranches += $script:perFile[$k].branches; $script:coveredBranches += $script:perFile[$k].coveredBranches
    $script:totalFunctions += $script:perFile[$k].functions; $script:coveredFunctions += $script:perFile[$k].coveredFunctions
  }
}

foreach($f in $coverageFiles){
  $p = $f.FullName
  if($p -match 'coverage-final.json$'){
    Write-Host "Parsing V8 JSON: $p"
    Parse-V8Json $p
  } elseif($p -match 'coverage-summary.json$'){
    Write-Host "Parsing Istanbul summary JSON: $p"
    Parse-IstanbulSummary $p
  } elseif($p -match 'lcov.info$'){
    Write-Host "Parsing lcov: $p"
    Parse-Lcov $p
  } else {
    Write-Host "Unknown coverage file type, attempting JSON parse: $p"
    try{ $j = Get-Content $p -Raw | ConvertFrom-Json; Parse-IstanbulSummary $p } catch { Write-Warning "Skipping $p" }
  }
}

if($script:totalStatements -eq 0 -and $script:totalBranches -eq 0 -and $script:totalFunctions -eq 0){
  "NO METRICS: Parsers found zero totals" | Out-File -FilePath $outSummary -Encoding utf8
  "NO-METRICS-ZERO" | Out-File -FilePath $outDiag -Encoding utf8
  Write-Host 'No measurable metrics found in coverage artifacts.'
  exit 2
}

function Percent($num,$den){ if($den -eq 0){ return 100 } else { return [math]::Round(100.0 * $num / $den, 2) } }

$pctStatements = Percent $script:coveredStatements $script:totalStatements
$pctBranches = Percent $script:coveredBranches $script:totalBranches
$pctFunctions = Percent $script:coveredFunctions $script:totalFunctions

$threshold = $env:COVERAGE_THRESHOLD
if(-not $threshold){ $threshold = 100 }
else { $threshold = [int]$threshold }

$summary = @()
$summary += "COVERAGE SUMMARY METRICS"
$summary += "Total statements: $script:coveredStatements / $script:totalStatements ($pctStatements%)"
$summary += "Total branches:   $script:coveredBranches / $script:totalBranches ($pctBranches%)"
$summary += "Total functions:  $script:coveredFunctions / $script:totalFunctions ($pctFunctions%)"
$summary += "Threshold: $threshold% (env:COVERAGE_THRESHOLD)"

$summary | Out-File -FilePath $outSummary -Encoding utf8

$diag = @()
$diag += "PER FILE (sample up to 200 entries)"
foreach($k in ($script:perFile.Keys | Sort-Object) | Select-Object -First 200){
  $v = $script:perFile[$k]
  $ps = Percent $v.coveredStatements $v.statements
  $pb = Percent $v.coveredBranches $v.branches
  $pf = Percent $v.coveredFunctions $v.functions
  $diag += "${k}`n  statements: $($v.coveredStatements)/$($v.statements) ($ps%)  branches: $($v.coveredBranches)/$($v.branches) ($pb%)  functions: $($v.coveredFunctions)/$($v.functions) ($pf%)"
}

$diag | Out-File -FilePath $outDiag -Encoding utf8

Write-Host "Summary written to $outSummary"
Write-Host "Diag written to $outDiag"

# Decide pass/fail: require all three metrics >= threshold (only consider metrics that have non-zero denominator)
$ok = $true
if($totalStatements -gt 0 -and $pctStatements -lt $threshold){ $ok = $false }
if($totalBranches -gt 0 -and $pctBranches -lt $threshold){ $ok = $false }
if($totalFunctions -gt 0 -and $pctFunctions -lt $threshold){ $ok = $false }

if($ok){ Write-Host "COVERAGE CHECK PASSED ($pctStatements% statements, $pctBranches% branches, $pctFunctions% functions)"; exit 0 } else { Write-Host "COVERAGE CHECK FAILED ($pctStatements% statements, $pctBranches% branches, $pctFunctions% functions)"; exit 1 }

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

# If repository root contains a .coverage.ignore file, honor those patterns to exclude
# lines (one pattern per line, supports simple wildcards '*' and path substrings).
$ignoreFile = Join-Path $repoRoot '.coverage.ignore'
$ignorePatterns = @()
if (Test-Path $ignoreFile) {
  Write-Host "Found .coverage.ignore; reading patterns"
  $ignorePatterns = Get-Content $ignoreFile | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') }
  foreach ($pat in $ignorePatterns) { Write-Host "  ignore: $pat" }

  # Filter coverageFiles by patterns
  $coverageFiles = $coverageFiles | Where-Object {
    $full = $_.FullName.Replace('/','\').ToLower()
    $keep = $true
    foreach ($pat in $ignorePatterns) {
      $p = $pat.Replace('/','\').ToLower()
      try {
        if ($p -like '*`*') {
          # If pattern contains wildcard characters, use -like directly
          if ($full -like $p) { $keep = $false; break }
        } else {
          # substring match
          if ($full -like "*${p}*") { $keep = $false; break }
        }
      } catch { if ($full -like "*${p}*") { $keep = $false; break } }
    }
    $keep
  }
  Write-Host "After .coverage.ignore filtering, $($coverageFiles.Count) coverage files remain"
}

# Filter out known locations that contain stale or disabled coverage artifacts
# (e.g. backups, vendor node_modules copies, or our .artifacts directory).
$coverageFiles = $coverageFiles | Where-Object {
  $p = $_.FullName.ToLower()
  # Exclude any path that looks like an archived/disabled package or vendor copy,
  # as well as repo artifact directories and node_modules
  -not (
    $p -like '*disabled-packages*' -or
    $p -like '*.disabled*' -or
    $p -like '*\\node_modules\\*' -or
    $p -like '*node_modules*' -or
    $p -like '*\\.artifacts\\*' -or
    $p -like '*.artifacts*'
  )
}

Write-Host "After filtering, scanning $($coverageFiles.Count) coverage files"

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

  # Helper to process one entry (name -> m)
  function Process-Entry([string]$name, $m){
    if(-not $name -or -not $m){ return }
    # helper: count entries in a map-like object
    function Count-Entries($obj){
      if($null -eq $obj){ return 0 }
      try{ if($obj -is [System.Collections.IDictionary]){ return $obj.Keys.Count } } catch {}
      try{ if($obj -is [System.Array]){ return $obj.Length } } catch {}
      try{ return ($obj.PSObject.Properties).Count } catch {}
      try{ return ($obj | Get-Member -MemberType NoteProperty | Measure-Object).Count } catch {}
      return 0
    }
    function Count-Covered($obj){
      if($null -eq $obj){ return 0 }
      try{ if($obj -is [System.Collections.IDictionary]){ return ($obj.Values | Where-Object { [int]$_ -gt 0 } | Measure-Object).Count } } catch {}
      try{ if($obj -is [System.Array]){ return (($obj | Where-Object { $_ -gt 0 }) | Measure-Object).Count } } catch {}
      try{ return ($obj.PSObject.Properties | Where-Object { [int]$_.Value -gt 0 } | Measure-Object).Count } catch {}
      try{ return (($obj | Where-Object { $_ -is [int] -and $_ -gt 0 }) | Measure-Object).Count } catch {}
      return 0
    }

    $sCount = Count-Entries $m.statementMap
    $sCov = Count-Covered $m.s
    $fCount = Count-Entries $m.fnMap
    $fCov = Count-Covered $m.f
    $bCount = Count-Entries $m.branchMap
    # branches covered: values are arrays of branch hits -> count entries where any element > 0
    $bCov = 0
    if($m.b -ne $null){
      try{
        # Prefer enumerating PSObject properties for predictable behavior across JSON shapes
        $props = $m.b.PSObject.Properties
        foreach($prop in $props){
          $val = $prop.Value
          if($val -is [System.Collections.IEnumerable]){
            # check if any numeric entry > 0
            $anyHits = ($val | Where-Object { try { ([int]$_) -gt 0 } catch { $false } } | Measure-Object).Count
            if($anyHits -gt 0){ $bCov += 1 }
          } else {
            try{ if(([int]$val) -gt 0){ $bCov += 1 } } catch {}
          }
        }
      } catch {
        # Fallback: m.b might be an array or other enumerable
        try{
          foreach($v in @($m.b)){
            $anyHits = ($v | Where-Object { try { ([int]$_) -gt 0 } catch { $false } } | Measure-Object).Count
            if($anyHits -gt 0){ $bCov += 1 }
          }
        } catch {}
      }
    }

    Write-Host "  -> $name : statements=$sCount covered=$sCov functions=$fCount coveredFns=$fCov branches=$bCount coveredBr=$bCov"
    $script:totalStatements += $sCount; $script:coveredStatements += $sCov
    $script:totalFunctions += $fCount; $script:coveredFunctions += $fCov
    $script:totalBranches += $bCount; $script:coveredBranches += $bCov

    $script:perFile[$name] = @{ statements=$sCount; coveredStatements=$sCov; functions=$fCount; coveredFunctions=$fCov; branches=$bCount; coveredBranches=$bCov }
  }

  # j may be an object keyed by file path or an array of entries
  if($j -is [System.Array]){
    Write-Host "V8 JSON is an array with $($j.Length) entries for $filePath"
    foreach($entry in $j){
      if($null -eq $entry){ continue }
      if($entry.PSObject.Properties.Name -contains 'path'){ Process-Entry $entry.path $entry; continue }
      if($entry.PSObject.Properties.Count -gt 0){
        foreach($prop in $entry.PSObject.Properties){ Process-Entry $prop.Name $prop.Value }
      }
    }
    return
  }

  # Otherwise expect an object with file-keyed properties
  $props = @()
  try { $props = @($j.PSObject.Properties) } catch { $props = @() }
  if($j -ne $null -and $props -and $props.Count -gt 0){
    Write-Host "V8 JSON root properties: $($props.Count) for $filePath"
    foreach($prop in $props){ Process-Entry $prop.Name $prop.Value }
  } else {
    Write-Warning "Unexpected V8 JSON shape for $filePath"
    return
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
    if($line -like 'SF:*'){ $current = $line.Substring(3); if(-not $script:perFile.ContainsKey($current)){ $script:perFile[$current]=@{ statements=0; coveredStatements=0; branches=0; coveredBranches=0; functions=0; coveredFunctions=0 } } }
    elseif($line -like 'DA:*'){ # DA:<line>,<count>
      $parts = $line.Substring(3).Split(',')
      $script:perFile[$current].statements += 1
      if([int]$parts[1] -gt 0){ $script:perFile[$current].coveredStatements += 1 }
    }
    elseif($line -like 'BRDA:*'){ # BRDA:<line>,<block>,<branch>,<taken>
      $parts = $line.Substring(5).Split(',')
      $script:perFile[$current].branches += 1
      if($parts[3] -ne '-' -and [int]$parts[3] -gt 0){ $script:perFile[$current].coveredBranches += 1 }
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

# Remove per-file entries that are known to be generated test artifacts or compiled wrappers
# (common patterns: *.e2e.*, *.repo.*, *e2e.test.js) before recomputing totals.
$excludePatterns = @('\\.e2e\\.','\\.e2e\\.test','\\.repo\\.','e2e.test.js','E2E.TEST.JS')

foreach($pat in $excludePatterns){
  $toRemove = @($script:perFile.Keys | Where-Object { $_ -match $pat })
  foreach($k in $toRemove){ $null = $script:perFile.Remove($k); Write-Host "Excluding per-file entry: $k" }
}

# Recompute totals from the filtered perFile table (avoid double accumulation)
$script:totalStatements = 0; $script:coveredStatements = 0; $script:totalBranches = 0; $script:coveredBranches = 0; $script:totalFunctions = 0; $script:coveredFunctions = 0
foreach($k in $script:perFile.Keys){
  $v = $script:perFile[$k]
  $script:totalStatements += ($v.statements -as [int])
  $script:coveredStatements += ($v.coveredStatements -as [int])
  $script:totalBranches += ($v.branches -as [int])
  $script:coveredBranches += ($v.coveredBranches -as [int])
  $script:totalFunctions += ($v.functions -as [int])
  $script:coveredFunctions += ($v.coveredFunctions -as [int])
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

# Optionally allow ignoring branch metric via env var IGNORE_BRANCHES=1
$ignoreBranches = $false
if($env:IGNORE_BRANCHES -and $env:IGNORE_BRANCHES -eq '1'){ $ignoreBranches = $true }

$summary = @()
$summary += "COVERAGE SUMMARY METRICS"
$summary += "Total statements: $script:coveredStatements / $script:totalStatements ($pctStatements%)"
$summary += "Total branches:   $script:coveredBranches / $script:totalBranches ($pctBranches%)"
$summary += "Total functions:  $script:coveredFunctions / $script:totalFunctions ($pctFunctions%)"
$summary += "Threshold: $threshold% (env:COVERAGE_THRESHOLD)"
if($ignoreBranches){ $summary += "NOTE: Branch coverage check is IGNORED (env:IGNORE_BRANCHES=1)" }

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
 if($script:totalStatements -gt 0 -and $pctStatements -lt $threshold){ $ok = $false }
 if(-not $ignoreBranches){ if($script:totalBranches -gt 0 -and $pctBranches -lt $threshold){ $ok = $false } }
 if($script:totalFunctions -gt 0 -and $pctFunctions -lt $threshold){ $ok = $false }

if($ok){ Write-Host "COVERAGE CHECK PASSED ($pctStatements% statements, $pctBranches% branches, $pctFunctions% functions)"; exit 0 } else { Write-Host "COVERAGE CHECK FAILED ($pctStatements% statements, $pctBranches% branches, $pctFunctions% functions)"; exit 1 }

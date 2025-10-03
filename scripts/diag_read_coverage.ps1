param()
$path = Join-Path $PSScriptRoot '..\packages\shared\coverage\coverage-final.json'
if(-not (Test-Path $path)){
  Write-Host "MISSING: $path"
  exit 2
}
try{
  $j = Get-Content $path -Raw | ConvertFrom-Json
} catch {
  Write-Host "FAIL: ConvertFrom-Json failed:`n$($_.Exception.Message)"
  exit 3
}
Write-Host "TopPropsCount:" $j.PSObject.Properties.Count
$first = $j.PSObject.Properties[0].Value
Write-Host "FirstKeys:" ( ($first.PSObject.Properties | ForEach-Object { $_.Name }) -join ', ')

# Helper to count items (keys) in a JSON map or elements in an array
function CountItems($obj){
  if($null -eq $obj){ return 0 }
  if($obj -is [System.Management.Automation.PSCustomObject]){ return $obj.PSObject.Properties.Count }
  if($obj -is [System.Collections.IEnumerable] -and -not ($obj -is [string])){ return ($obj | Measure-Object).Count }
  return 1
}

# Helper to count how many entries are "covered" (value > 0)
function CountCovered($obj){
  if($null -eq $obj){ return 0 }
  if($obj -is [System.Management.Automation.PSCustomObject]){
    return ($obj.PSObject.Properties | Where-Object { [int]$_.Value -gt 0 } | Measure-Object).Count
  }
  if($obj -is [System.Collections.IEnumerable] -and -not ($obj -is [string])){
    return (($obj | Where-Object { [int]$_ -gt 0 }) | Measure-Object).Count
  }
  if( [int]$obj -gt 0 ){ return 1 } else { return 0 }
}

$ts=0; $tc=0; $fs=0; $fc=0
foreach($prop in $j.PSObject.Properties){
  $m = $prop.Value
  # statements: count keys from s (fallback to statementMap)
  $smembers = @()
  try{ $smembers = $m.s | Get-Member -MemberType NoteProperty -Force } catch { $smembers = @() }
  if($smembers -and $smembers.Count -gt 0){
    $ts += $smembers.Count
    $tc += ($smembers | Where-Object { [int]($m.s.($_.Name)) -gt 0 } | Measure-Object).Count
  } else {
    # fallback: statementMap
    try{ $ts += $m.statementMap.PSObject.Properties.Count } catch { }
    $tc += CountCovered($m.s)
  }

  # functions: count keys from f
  $fmembers = @()
  try{ $fmembers = $m.f | Get-Member -MemberType NoteProperty -Force } catch { $fmembers = @() }
  if($fmembers -and $fmembers.Count -gt 0){
    $fs += $fmembers.Count
    $fc += ($fmembers | Where-Object { [int]($m.f.($_.Name)) -gt 0 } | Measure-Object).Count
  } else {
    try{ $fs += $m.fnMap.PSObject.Properties.Count } catch { }
    $fc += CountCovered($m.f)
  }

}
Write-Host "TOTALS ts=$ts tc=$tc fs=$fs fc=$fc"
exit 0

$ErrorActionPreference="Stop"; chcp 65001 > $null
# 0) deps
try{
  & pnpm -w install --prefer-frozen-lockfile > $null 2>&1
  if($LASTEXITCODE -ne 0){
    & pnpm -w install > $null 2>&1
    & pnpm -w install --lockfile-only > $null 2>&1
    if($LASTEXITCODE -ne 0){ throw "pnpm install failed" }
  }
} catch { throw "pnpm install failed" }

# 1) targets auto (con test:coverage)
$all=@('packages/shared','apps/web','apps/cockpit')|?{Test-Path "$_/package.json"}
$targets=@(); foreach($p in $all){ try{$j=gc "$p/package.json" -Raw|ConvertFrom-Json; if($j.scripts.'test:coverage'){$targets+=$p}}catch{} }
if(-not $targets){$targets=@('packages/shared')}

# 2) coverage en paralelo con timeout
function RunCov($p){ pnpm --dir $p run test:coverage }
$jobs=@(); foreach($p in $targets){
  $jobs+=Start-Job -ArgumentList $p -ScriptBlock {
    param($q)
    try{
      $out = & pnpm --dir $q run test:coverage 2>&1 | ForEach-Object { $_ }
      $ec = $LASTEXITCODE
      $out
      Write-Output "JOB_EXIT_CODE:$ec"
    } catch {
      Write-Output "JOB_EXIT_CODE:1"
    }
  }
}
if(-not (Wait-Job -Job $jobs -Timeout 600)){ $jobs|%{Stop-Job $_}; throw "Timeout coverage" }

$jobs|%{
  $text = (Receive-Job $_ -Keep | Out-String)
  if($text -match "FAIL|ERR"){ throw "Tests failed: $($_.Id)" }
  if($text -match "JOB_EXIT_CODE:(\d+)"){ if([int]$matches[1] -ne 0){ throw "Tests failed with exit code $($matches[1])" } }
}

# 3) gate peor-caso (≥90 stm, ≥80 fun)
function P([double]$n,[double]$d){ if($d -gt 0){[math]::Round(100*$n/$d,2)} }
function ReadPct($p){
  $s="$p/coverage/coverage-summary.json"; $f="$p/coverage/coverage-final.json"
  if(Test-Path $s){ $t=(gc $s -Raw|ConvertFrom-Json).total; return @{pkg=$p;stm=[double]$t.statements.pct;fun=[double]$t.functions.pct} }
  if(Test-Path $f){ $j=gc $f -Raw|ConvertFrom-Json; $ts=0;$tc=0;$fs=0;$fc=0
    foreach($m in $j.PSObject.Properties.Value){if($m.s){$ts+=$m.s}; if($m.f){$tc+=$m.f}; if($m.fn){$fs+=$m.fn}; if($m.fh){$fc+=$m.fh}; if($m.fnh){$fc+=$m.fnh}}
    return @{pkg=$p;stm=(P $tc $ts);fun=(P $fc $fs)} }
  return $null
}
$vals=@(); foreach($p in $targets){ $v=ReadPct $p; if($v){$vals+=$v}}
if(-not $vals){ Write-Error "NO-METRICS"; exit 1 }
$worst=$vals|Sort-Object stm,fun|Select-Object -First 1
if($worst.stm -lt 90 -or $worst.fun -lt 80){ Write-Error ("COVERAGE FAIL {0} stm={1}% fun={2}%" -f $worst.pkg,$worst.stm,$worst.fun); exit 1 }
Write-Host ("COVERAGE PASS worst={0} stm={1}% fun={2}%" -f $worst.pkg,$worst.stm,$worst.fun)

# 4) build+smoke cockpit (HTTP 200)
if(Test-Path "apps/cockpit/package.json"){
  pnpm --dir apps/cockpit run build
  $srv=Start-Job { node -e "const h=require('http'),fs=require('fs'),p=require('path');const r='apps/cockpit/dist';h.createServer((q,s)=>{let f=p.join(r,q.url==='/'?'index.html':q.url);fs.existsSync(f)&&fs.statSync(f).isFile()?fs.createReadStream(f).pipe(s): (s.statusCode=404,s.end());}).listen(5173)" }
  Start-Sleep -s 1
  $code=(try{ (Invoke-WebRequest -UseBasicParsing http://localhost:5173).StatusCode }catch{0})
  Stop-Job $srv | Out-Null
  if($code -ne 200){ throw "SMOKE FAIL cockpit" } else { Write-Host "SMOKE PASS cockpit" }
}

Write-Host "READY: CI-close ✓"; exit 0

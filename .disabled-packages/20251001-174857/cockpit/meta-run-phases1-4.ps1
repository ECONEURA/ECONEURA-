#!/usr/bin/env pwsh
<#
meta-run-phases1-4.ps1
Runs Fases 1-4: creates .dev/cockpit scaffolding (if missing), runs npm install, build, and quick checks (tsc/vitest).
DOES NOT push or create PRs. Run from repository root.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Info($m){ Write-Host "[info] $m" }
function Warn($m){ Write-Warning $m }

# Ensure we're in repo root (heuristic: look for .git)
if(-not (Test-Path -Path '.git')){
  Warn 'No .git found in current directory. Please run this script from the repository root.'
  exit 1
}

Info 'Switching/creating branch feature/cockpit-dev-setup (local only)'
try{
  & git rev-parse --verify feature/cockpit-dev-setup 2>$null
  if($LASTEXITCODE -eq 0){
    git switch feature/cockpit-dev-setup
  }else{
    git switch -c feature/cockpit-dev-setup
  }
}catch{
  # older git may return non-zero; try switch anyway
  git switch -c feature/cockpit-dev-setup 2>$null -ErrorAction SilentlyContinue || git checkout -b feature/cockpit-dev-setup
}

Info 'Preparing .dev/cockpit directory and minimal scaffolding (skip if exists)'
$app = Join-Path (Get-Location) '.dev/cockpit'
New-Item -Force -ItemType Directory -Path $app | Out-Null

$src = Join-Path $app 'src'
$dist = Join-Path $app 'dist'
$vsc = Join-Path $app '.vscode'
New-Item -Force -ItemType Directory -Path $src,$dist,$vsc | Out-Null

# create sample EconeuraCockpit.tsx if missing
$cockpitFile = Join-Path $src 'EconeuraCockpit.tsx'
if(-not (Test-Path $cockpitFile)){
  Info 'Creating sample EconeuraCockpit.tsx'
  @'
import React from "react";
export default function EconeuraCockpit(){
  return (
    <div className="p-6 font-semibold">
      ECONEURA Cockpit (dev placeholder)
    </div>
  )
}
'@ | Out-File -Encoding utf8 $cockpitFile
}

# index.tsx
$indexFile = Join-Path $src 'index.tsx'
if(-not (Test-Path $indexFile)){
  Info 'Creating src/index.tsx'
  @'
import { createRoot } from 'react-dom/client'
import EconeuraCockpit from './EconeuraCockpit'
const root = document.getElementById('root')!
createRoot(root).render(<EconeuraCockpit />)
'@ | Out-File -Encoding utf8 $indexFile
}

# package.json
$pkgFile = Join-Path $app 'package.json'
if(-not (Test-Path $pkgFile)){
  Info 'Creating package.json for cockpit'
  @'
{
  "name":"@econeura/cockpit-dev",
  "version":"0.0.0",
  "type":"module",
  "private":true,
  "scripts":{
    "build":"esbuild src/index.tsx --bundle --format=esm --target=es2020 --outfile=dist/app.js --loader:.tsx=tsx --loader:.ts=ts --jsx=automatic",
    "watch":"npm run build -- --watch",
    "test":"vitest"
  },
  "dependencies":{
    "react":"18.3.1",
    "react-dom":"18.3.1",
    "lucide-react":"0.441.0"
  },
  "devDependencies":{
    "esbuild":"0.23.0",
    "vitest":"^1.6.1",
    "@testing-library/react":"^14.3.1",
    "@testing-library/jest-dom":"^6.9.0",
    "jsdom":"^21.1.2",
    "@types/react":"^18.3.25",
    "@types/react-dom":"^18.3.7"
  }
}
'@ | Out-File -Encoding utf8 $pkgFile
}

# index.html
$htmlFile = Join-Path $dist 'index.html'
if(-not (Test-Path $htmlFile)){
  Info 'Creating dist/index.html'
  "<!doctype html><html lang='es'><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><title>ECONEURA Cockpit (Dev)</title><script src='https://cdn.tailwindcss.com'></script></head><body class='min-h-screen bg-[#f2f7fb] text-[#0f172a]'><div id='root'></div><script type='module' src='./app.js'></script></body></html>" | Out-File -Encoding utf8 $htmlFile
}

# VSCode settings for Live Preview (absolute path helps Live Preview extension)
$vscFile = Join-Path $vsc 'settings.json'
if(-not (Test-Path $vscFile)){
  Info 'Writing .vscode/settings.json (Live Preview target)'
  $absEscaped = (Join-Path $dist 'index.html') -replace '\\','\\\\'
  $jsonTemplate = @'
{
  "livePreview.defaultPreviewPath": "{0}",
  "livePreview.openPreviewTarget": "Embedded Preview",
  "livePreview.serverKeepAliveAfterEmbeddedPreviewClose": true
}
'@
  ($jsonTemplate -f $absEscaped) | Out-File -Encoding utf8 $vscFile
}

Push-Location $app
try{
  Info 'Installing npm deps (this may take a moment)'
  npm install --no-audit --no-fund
}catch{
  Warn 'npm install failed; inspect output above.'; Pop-Location; exit 1
}

Info 'Running npm run build (esbuild)'
try{ npm run -s build }catch{ Warn 'build failed'; Pop-Location; exit 1 }

# start watch in background
try{
  Info 'Starting watch in background (npm run watch)'
  $watch = Start-Process -PassThru -WindowStyle Hidden -FilePath npm -ArgumentList 'run','watch'
  $watch.Id | Out-File -Encoding ascii '.watch.pid'
}catch{ Warn 'Could not start watch process (non-fatal)'
}

# start simple static server (python) on available port
function PickPort([int[]]$candidates){ foreach($p in $candidates){ try{ $l=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$p); $l.Start(); $l.Stop(); return $p }catch{} } return $null }
$ports = 8080,5500,5173
$port = PickPort $ports
if(-not $port){ Warn 'No free port from candidates'; $port = 0 }
if($port -gt 0){
  Info ("Starting static server on port {0}" -f $port)
  Push-Location $dist
  if(Get-Command py -ErrorAction SilentlyContinue){
    $srv = Start-Process -PassThru -FilePath py -ArgumentList '-m','http.server',$port,'--bind','127.0.0.1' -WindowStyle Hidden
  }else{
    $srv = Start-Process -PassThru -FilePath python -ArgumentList '-m','http.server',$port,'--bind','127.0.0.1' -WindowStyle Hidden
  }
  $srv.Id | Out-File -Encoding ascii '..\.server.pid'
  Start-Sleep -Milliseconds 500
  try{
    $u = "http://127.0.0.1:$port/"
    $h = Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 5
    if($h.Content -match '<div id="root">'){
      Info "Static server responding at $u"
    }else{ Info "Server up at $u (no root div yet)" }
  }catch{ Warn "Health check failed for http://127.0.0.1:$port/" }
  Pop-Location
}else{ Warn 'Skipping static server; no free port found' }

Pop-Location

## Phase 4 quick checks: tsconfig dev + axios types + tsc + vitest (fast)
Info 'Creating tsconfig.cockpit.dev.json and types/axios.d.ts (if missing)'
$repoRoot = Get-Location
$tsFile = Join-Path $repoRoot 'tsconfig.cockpit.dev.json'
if(-not (Test-Path $tsFile)){
  @'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "strict": true,
    "types": ["node"]
  },
  "include": [".dev/cockpit/src/**/*","apps/web/src/**/*"],
  "exclude": ["**/node_modules/**","**/dist/**"]
}
'@ | Out-File -Encoding utf8 $tsFile
}

$typesDir = Join-Path $repoRoot 'types'
New-Item -Force -ItemType Directory -Path $typesDir | Out-Null
$axiosTypes = Join-Path $typesDir 'axios.d.ts'
if(-not (Test-Path $axiosTypes)){
  @'
import "axios";
declare module "axios" {
  export interface AxiosRequestConfig { metadata?: Record<string, any> }
}
'@ | Out-File -Encoding utf8 $axiosTypes
}

Info 'Running quick typecheck (tsc)'
try{ npx tsc -p tsconfig.cockpit.dev.json --noEmit }catch{ Warn 'tsc check failed or tsc not available'; }

Info 'Running quick vitest (only existing tests under .dev/cockpit)'
try{ npx vitest run --reporter=basic }catch{ Warn 'Vitest run failed or no tests present'; }

Info 'Meta-run finished. No git push performed. Review new files under .dev/cockpit and commit selectively.'

Write-Host "To commit tests and scaffolding (selective):`n git add .dev/cockpit/src .dev/cockpit/package.json .dev/cockpit/dist/index.html tsconfig.cockpit.dev.json types/axios.d.ts`n git commit -m `"chore(cockpit): scaffold + quick checks`""

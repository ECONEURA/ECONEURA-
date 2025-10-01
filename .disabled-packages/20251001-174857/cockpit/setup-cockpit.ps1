# ==== ECONEURA: Cockpit Dev Ultra-Ligero (pwsh) ====
$ErrorActionPreference="Stop"; Set-StrictMode -Version Latest

# Config base
$APP=".dev/cockpit"; $SRC="$APP/src"; $DIST="$APP/dist"; $VSC="$APP/.vscode"
$cwd = (Get-Location).Path
${COCKPIT_HOST}=${env:HOST}; if([string]::IsNullOrWhiteSpace($COCKPIT_HOST)){$COCKPIT_HOST="127.0.0.1"}
$CANDIDATE_PORTS=8080,5500,5173

# Utils
function Need($name){ if(-not (Get-Command $name -ErrorAction SilentlyContinue)){ throw "❌ Falta '$name' en PATH" } }
function KillIfRunning($pidPath){
  if(Test-Path $pidPath){ 
    $oldPid = Get-Content $pidPath -ErrorAction SilentlyContinue
    if($oldPid -and (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)){ Stop-Process -Id $oldPid -Force }
    Remove-Item $pidPath -ErrorAction SilentlyContinue
  }
}
function Pick-FreePort([int[]]$ports){
  foreach($p in $ports){
    try{ $l=New-Object System.Net.Sockets.TcpListener([Net.IPAddress]::Parse($COCKPIT_HOST),$p); $l.Start(); $l.Stop(); return $p }catch{}
  } throw "❌ No hay puerto libre en: $($ports -join ', ')"
}

# Requisitos mínimos
Need node; Need npm
if(-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command py -ErrorAction SilentlyContinue)){ throw "❌ Falta Python (python/py)" }

# Estructura (sin ruido)
New-Item -Force -ItemType Directory -Path $SRC,$DIST,$VSC | Out-Null

# Intenta copiar tu EconeuraCockpit.tsx si no existe ya
if(-not (Test-Path "$SRC/EconeuraCockpit.tsx")){
  $cwd = (Get-Location).Path
  $paths = @(
    "apps/web/src/EconeuraCockpit.tsx","web/src/EconeuraCockpit.tsx","src/EconeuraCockpit.tsx"
  ) | ForEach-Object {
    if([System.IO.Path]::IsPathRooted($_)) { $_ } else { Join-Path $cwd $_ }
  } | Where-Object { Test-Path $_ }
  # Limpia y muestra rutas candidatas para diagnóstico (asegura array aunque haya 1 elemento)
  $paths = @($paths | ForEach-Object { $_.ToString().Trim() })
  Write-Host "[cockpit] Rutas candidatas detectadas:" -ForegroundColor Cyan
  if($paths -and $paths.Length -gt 0){
    $i=0; foreach($p in $paths){ $i++; Write-Host "  $i) $p" }
  } else { Write-Host "  (ninguna)" -ForegroundColor Yellow }
  if($paths -and $paths.Length -gt 0){
    $destDir = Join-Path $cwd $SRC
    Write-Host "[cockpit] cwd=[$cwd] SRC=[$SRC] destDir=[$destDir]" -ForegroundColor Magenta
    Write-Host "[cockpit] Test-Path destDir: $(Test-Path $destDir)" -ForegroundColor Magenta
    if(-not (Test-Path $destDir)){ New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
    $dest = Join-Path $destDir 'EconeuraCockpit.tsx'
    Write-Host "[cockpit] Copiando '$($paths[0])' -> '$dest'" -ForegroundColor Cyan
    Copy-Item -Force $paths[0] -Destination $dest
  }
  if(-not (Test-Path "$SRC/EconeuraCockpit.tsx")){
@'
import React from "react";
export default function EconeuraCockpit(){return <div className="p-6 font-semibold">Pega aquí tu EconeuraCockpit.tsx EXACTO.</div>;}
'@ | Out-File -Encoding 'utf8' "$SRC/EconeuraCockpit.tsx"
  }
}

# Entry React mínimo (idempotente)
@'
import { createRoot } from "react-dom/client";
import EconeuraCockpit from "./EconeuraCockpit";
const el = document.getElementById("root")!;
createRoot(el).render(<EconeuraCockpit />);
'@ | Out-File -Encoding 'utf8' "$SRC/index.tsx"

# package.json compacto (no reinstala si ya hay node_modules)
@'
{
  "name": "@econeura/cockpit-dev",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "esbuild src/index.tsx --bundle --format=esm --target=es2020 --outfile=dist/app.js --loader:.tsx=tsx --loader:.ts=ts --jsx=automatic",
    "watch": "npm run build -- --watch"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "lucide-react": "0.441.0"
  },
  "devDependencies": { "esbuild": "0.23.0" }
}
'@ | Out-File -Encoding 'utf8' "$APP/package.json"

# HTML con Tailwind CDN (pixel-lock)
@'
<!doctype html><html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ECONEURA Cockpit (Dev)</title>
<script src="https://cdn.tailwindcss.com"></script>
</head><body class="min-h-screen bg-[#f2f7fb] text-[#0f172a]">
<div id="root"></div><script type="module" src="./app.js"></script>
</body></html>
'@ | Out-File -Encoding 'utf8' "$DIST/index.html"

# Settings Live Preview (abre dist/index.html)
@"
{ "livePreview.defaultPreviewPath": "$(Get-Location)/$DIST/index.html",
  "livePreview.openPreviewTarget": "Embedded Preview",
  "livePreview.serverKeepAliveAfterEmbeddedPreviewClose": true }
"@ | Out-File -Encoding utf8 "$VSC/settings.json"

Set-Location $APP

# Instala deps solo si faltan
if(-not (Test-Path "node_modules")){ npm install --silent | Out-Null }

# Limpia procesos previos
KillIfRunning ".watch.pid"; KillIfRunning ".server.pid"

# Build inicial + watcher
npm run -s build
$p = Start-Process -PassThru -WindowStyle Minimized npm -ArgumentList "run","watch"
$p.Id | Out-File ".watch.pid" -Encoding ascii

# Servidor estático: probar puertos candidatos secuencialmente (python -> npx)
$distPath = Join-Path $cwd $DIST
$pythonCmd = if(Get-Command py -ErrorAction SilentlyContinue){ 'py' } elseif (Get-Command python -ErrorAction SilentlyContinue){ 'python' } else { $null }
$npxAvailable = (Get-Command npx -ErrorAction SilentlyContinue) -ne $null

function Wait-PortOpen($hostname,$port,$timeoutMs){
  $maxWait = $timeoutMs; $interval=300; $elapsed=0; $open=$false
  while($elapsed -lt $maxWait){
    try{ $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect($hostname,[int]$port); $tcp.Close(); $open=$true; break }catch{}
    Start-Sleep -Milliseconds $interval; $elapsed += $interval
  }
  return $open
}

Write-Host "[cockpit] Intentando arrancar servidor estático en ${COCKPIT_HOST} dir=$distPath" -ForegroundColor Cyan

$sp = $null; $PORT = $null
foreach($candidate in $CANDIDATE_PORTS){
  Write-Host "[cockpit] Probando puerto candidato: $candidate" -ForegroundColor Cyan
  # Intento preferente: npx http-server (más rápido en entornos Node-first)
  if($npxAvailable){
    try{
      $tmp = Start-Process -PassThru -FilePath 'npx' -ArgumentList @('--yes','http-server',$distPath,'-p',$candidate,'-a',$COCKPIT_HOST,'-c','-1') -WorkingDirectory $cwd -WindowStyle Minimized
      Write-Host "[cockpit] npx server pid=$($tmp.Id) (intentando puerto $candidate)" -ForegroundColor Cyan
      $tmp.Id | Out-File ".server.pid" -Encoding ascii
      if(Wait-PortOpen $COCKPIT_HOST $candidate 5000){ $sp=$tmp; $PORT=$candidate; Write-Host "[cockpit] npx escuchando en $candidate" -ForegroundColor Green; break } else { Write-Host "[cockpit] npx no abrió puerto $candidate, matando proceso" -ForegroundColor Yellow; try{ Stop-Process -Id $tmp.Id -Force -ErrorAction SilentlyContinue }catch{} }
    } catch { Write-Host ("[cockpit] No se pudo iniciar npx en {0}: {1}" -f $candidate, $_) -ForegroundColor Yellow }
  }

  # Si npx no está disponible o falló, intentamos python si está instalado
  if(-not $sp -and $pythonCmd){
    try{
      $tmp = Start-Process -PassThru -FilePath $pythonCmd -ArgumentList "-m","http.server","$candidate","--bind","$COCKPIT_HOST" -WorkingDirectory $distPath -WindowStyle Minimized
      Write-Host "[cockpit] python pid=$($tmp.Id)" -ForegroundColor Cyan
      $tmp.Id | Out-File ".server.pid" -Encoding ascii
      if(Wait-PortOpen $COCKPIT_HOST $candidate 5000){ $sp=$tmp; $PORT=$candidate; Write-Host "[cockpit] python escuchando en $candidate" -ForegroundColor Green; break } else { Write-Host "[cockpit] python no abrió puerto $candidate, matando proceso" -ForegroundColor Yellow; try{ Stop-Process -Id $tmp.Id -Force -ErrorAction SilentlyContinue }catch{} }
    } catch { Write-Host ("[cockpit] fallo al iniciar python en {0}: {1}" -f $candidate, $_) -ForegroundColor Yellow }
  }
}

if(-not $sp){ throw "❌ No se pudo iniciar servidor estático en ninguno de los puertos: $($CANDIDATE_PORTS -join ', ')" }

# Health rápido
$u = "http://${COCKPIT_HOST}:${PORT}/"
try{ $html = Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 5 } catch { throw ("❌ No se pudo conectar a {0} : {1}" -f $u, $_) }
if($html.Content -notmatch '<div id="root"></div>'){ throw "❌ DOM base no encontrado en $u" }

"`n✅ Cockpit sirviendo: $u"
"👉 VS Code: F1 → 'Simple Browser: Show' → pega la URL, o abre $DIST/index.html con 'Open with Live Preview'."
"🔄 Hot-reload: guarda cambios en src/, esbuild recompila; refresca si no auto-recarga."
 '🧹 Para parar: Get-Content .watch.pid,.server.pid | % { if($_){ Stop-Process -Id $_ -Force } }'

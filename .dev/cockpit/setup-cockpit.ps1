# ==== ECONEURA: Cockpit Dev Ultra-Ligero (pwsh) ====
$ErrorActionPreference="Stop"; Set-StrictMode -Version Latest

# Config base
$APP=".dev/cockpit"; $SRC="$APP/src"; $DIST="$APP/dist"; $VSC="$APP/.vscode"
$HOST=${env:HOST}; if([string]::IsNullOrWhiteSpace($HOST)){$HOST="127.0.0.1"}
$CANDIDATE_PORTS=8080,5500,5173

# Utils
function Need($name){ if(-not (Get-Command $name -ErrorAction SilentlyContinue)){ throw "❌ Falta '$name' en PATH" } }
function KillIfRunning($pidPath){
  if(Test-Path $pidPath){ $pid=Get-Content $pidPath -ErrorAction SilentlyContinue
    if($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)){ Stop-Process -Id $pid -Force }
    Remove-Item $pidPath -ErrorAction SilentlyContinue
  }
}
function Pick-FreePort([int[]]$ports){
  foreach($p in $ports){
    try{ $l=New-Object System.Net.Sockets.TcpListener([Net.IPAddress]::Parse($HOST),$p); $l.Start(); $l.Stop(); return $p }catch{}
  } throw "❌ No hay puerto libre en: $($ports -join ', ')"
}

# Requisitos mínimos
Need node; Need npm
if(-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command py -ErrorAction SilentlyContinue)){ throw "❌ Falta Python (python/py)" }

# Estructura (sin ruido)
New-Item -Force -ItemType Directory -Path $SRC,$DIST,$VSC | Out-Null

# Intenta copiar tu EconeuraCockpit.tsx si no existe ya
if(-not (Test-Path "$SRC/EconeuraCockpit.tsx")){
  $paths=@(
    "apps/web/src/EconeuraCockpit.tsx","web/src/EconeuraCockpit.tsx","src/EconeuraCockpit.tsx"
  ) | ForEach-Object { Join-Path (Get-Location) $_ } | Where-Object { Test-Path $_ }
  if($paths.Count -gt 0){ Copy-Item -Force $paths[0] "$SRC/EconeuraCockpit.tsx" }
  if(-not (Test-Path "$SRC/EconeuraCockpit.tsx")){
@'import React from "react";
export default function EconeuraCockpit(){return <div className="p-6 font-semibold">Pega aquí tu EconeuraCockpit.tsx EXACTO.</div>;}
'@ | Out-File -Encoding utf8 "$SRC/EconeuraCockpit.tsx"
  }
}

# Entry React mínimo (idempotente)
@'
import { createRoot } from "react-dom/client";
import EconeuraCockpit from "./EconeuraCockpit";
const el = document.getElementById("root")!;
createRoot(el).render(<EconeuraCockpit />);
'@ | Out-File -Encoding utf8 "$SRC/index.tsx"

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
'@ | Out-File -Encoding utf8 "$APP/package.json"

# HTML con Tailwind CDN (pixel-lock)
@'
<!doctype html><html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ECONEURA Cockpit (Dev)</title>
<script src="https://cdn.tailwindcss.com"></script>
</head><body class="min-h-screen bg-[#f2f7fb] text-[#0f172a]">
<div id="root"></div><script type="module" src="./app.js"></script>
</body></html>
'@ | Out-File -Encoding utf8 "$DIST/index.html"

# Settings Live Preview (abre dist/index.html)
@"
{ "livePreview.defaultPreviewPath": "$(Get-Location)\$DIST\index.html",
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

# Servidor estático en puerto libre
$PORT = Pick-FreePort $CANDIDATE_PORTS
Push-Location "dist"
if(Get-Command py -ErrorAction SilentlyContinue){ $sp = Start-Process -PassThru -WindowStyle Minimized py -ArgumentList "-m","http.server","$PORT","--bind","$HOST" }
else{ $sp = Start-Process -PassThru -WindowStyle Minimized python -ArgumentList "-m","http.server","$PORT","--bind","$HOST" }
Pop-Location
$sp.Id | Out-File ".server.pid" -Encoding ascii

# Health rápido
Start-Sleep -Milliseconds 300
$u="http://$HOST`:$PORT/"; $html=Invoke-WebRequest -UseBasicParsing $u -TimeoutSec 5
if($html.Content -notmatch '<div id="root"></div>'){ throw "❌ DOM base no encontrado en $u" }

"`n✅ Cockpit sirviendo: $u"
"👉 VS Code: F1 → 'Simple Browser: Show' → pega la URL, o abre $DIST\index.html con 'Open with Live Preview'."
"🔄 Hot-reload: guarda cambios en src/, esbuild recompila; refresca si no auto-recarga."
"🧹 Para parar: Get-Content .watch.pid,.server.pid | % { if($_){ Stop-Process -Id $_ -Force } }"

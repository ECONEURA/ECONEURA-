#!/bin/bash
set -euo pipefail

# ── 0) Requisitos
command -v node >/dev/null || { echo "❌ Falta Node.js (>=18). Instálalo o usa devcontainer de Node."; exit 1; }
command -v npm  >/dev/null || { echo "❌ Falta npm."; exit 1; }

# ── 1) Raíz web
ROOT="$(pwd)"
for d in apps/web web .; do
  if [ -f "$d/package.json" ] || [ -d "$d/src" ] || [ -f "$d/index.html" ]; then WEB_DIR="$d"; break; fi
done
WEB_DIR="${WEB_DIR:-apps/web}"
mkdir -p "$WEB_DIR"/src "$WEB_DIR"/preview "$WEB_DIR"/.vscode
cd "$WEB_DIR"

# ── 2) package.json mínimo (idempotente)
if [ ! -f package.json ]; then
cat > package.json <<JSON
{
  "name": "econeura-web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 8080 --strictPort",
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1 --port 8080 --strictPort"
  }
}
JSON
fi

# ── 3) Dependencias (pin exacto)
npm pkg set engines.node=">=18"
npm i -D -E vite@5.4.8 @vitejs/plugin-react@4.3.1 typescript@5.5.4 @types/react@18.3.5 @types/react-dom@18.3.0 >/dev/null 2>&1 || true
npm i    -E react@18.3.1 react-dom@18.3.1 lucide-react@0.441.0 >/dev/null 2>&1 || true

# ── 4) Config Vite + TS (idempotente)
[ -f vite.config.ts ] || cat > vite.config.ts <<TS
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 8080, strictPort: true }
});
TS

[ -f tsconfig.json ] || cat > tsconfig.json <<JSON
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
JSON

# ── 5) Entradas React (no pisa tu cockpit)
[ -f src/main.tsx ] || cat > src/main.tsx <<TS
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
createRoot(document.getElementById("root")!).render(<App />);
TS

if [ ! -f src/App.tsx ]; then
  if CANDIDATE=$(ls src/EconeuraCockpit*.tsx src/components/EconeuraCockpit*.tsx 2>/dev/null | head -n1); then
    MOD="${CANDIDATE#src/}"
    cat > src/App.tsx <<TS
import React from "react";
import Cockpit from "./${MOD}";
export default function App(){ return <Cockpit/>; }
TS
  else
    cat > src/App.tsx <<TS
import React from "react";
export default function App(){
  return <div style={{padding:16,fontFamily:"ui-sans-serif"}}>
    Coloca tu <code>src/EconeuraCockpit.tsx</code> y se montará automáticamente.
  </div>;
}
TS
  fi
fi

# ── 6) index.html con Tailwind CDN (look & feel idéntico, sin build CSS)
if [ ! -f index.html ]; then
cat > index.html <<HTML
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>ECONEURA Cockpit</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>window.__ECONEURA_BEARER="SIMULATED_TOKEN";</script>
  </head>
  <body class="min-h-screen bg-[#f2f7fb] text-[#0f172a]">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML
fi

# ── 7) Vista embebida para VS Code Live Preview (iframe a Vite:8080)
cat > preview/preview.html << "HTML"
<!doctype html><html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ECONEURA – VS Code Preview</title>
<style>html,body,#wrap{height:100%;margin:0}iframe{border:0;width:100%;height:100%}
.bar{position:fixed;right:8px;top:8px;background:#ffffffcc;border:1px solid #e5e7eb;border-radius:10px;padding:6px 10px;font:12px ui-sans-serif,system-ui}
</style></head><body>
<div id="wrap"><iframe src="http://127.0.0.1:8080/"></iframe></div>
<div class="bar">ECONEURA • Cockpit 1:1 — fuente: <code>http://127.0.0.1:8080/</code></div>
<script>window.__ECONEURA_BEARER=window.__ECONEURA_BEARER||"SIMULATED_TOKEN";</script>
</body></html>
HTML

# ── 8) VS Code settings para Live Preview embebido
cat > .vscode/settings.json <<JSON
{
  "livePreview.defaultPreviewPath": "/preview/preview.html",
  "livePreview.openPreviewTarget": "Embedded Browser",
  "livePreview.serverPort": 5500
}
JSON

# ── 9) Arrancar Vite en background y esperar a que responda
if ! curl -fsS http://127.0.0.1:8080/ >/dev/null 2>&1; then
  nohup npm run dev >/tmp/econeura_vite.log 2>&1 &
  for i in $(seq 1 80); do
    sleep 0.25
    curl -fsS http://127.0.0.1:8080/ >/dev/null 2>&1 && break
    [ $i -eq 80 ] && { echo "❌ Vite no respondió. Revisa /tmp/econeura_vite.log"; exit 1; }
  done
fi

echo
echo "✅ Cockpit servido 1:1 en:     http://127.0.0.1:8080/"
echo "✅ Live Preview embebido:      abre preview/preview.html → «Open with Live Preview»"
echo "ℹ️  Logs Vite:                 tail -f /tmp/econeura_vite.log"
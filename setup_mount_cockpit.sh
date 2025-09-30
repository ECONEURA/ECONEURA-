#!/bin/bash
set -euo pipefail

# 0) Prechequeos
command -v node >/dev/null || { echo "❌ Falta Node>=18"; exit 1; }
command -v npm  >/dev/null || { echo "❌ Falta npm"; exit 1; }

# 1) Localiza carpeta web
ROOT="$(pwd)"; WEB=""
for d in apps/web web .; do
  if [ -d "$d" ]; then WEB="$d"; break; fi
done
[ -n "$WEB" ] || { echo "❌ No encuentro carpeta web"; exit 1; }
cd "$WEB"; mkdir -p src .vscode preview

# 2) Encuentra el cockpit exacto
COCKPIT_FILE="$(find src -maxdepth 3 -type f -name "EconeuraCockpit*.tsx" | head -n1 || true)"
[ -n "$COCKPIT_FILE" ] || { echo "❌ No existe src/EconeuraCockpit*.tsx. Coloca tu archivo ahí."; exit 1; }
# Ruta relativa desde src
REL_IMPORT="${COCKPIT_FILE#src/}"

# 3) package.json + deps fijadas
if [ ! -f package.json ]; then
  cat > package.json <<JSON
{ "name":"econeura-web","private":true,"type":"module",
  "scripts": {
    "dev":"vite --host 127.0.0.1 --port 8080 --strictPort",
    "build":"vite build",
    "preview":"vite preview --host 127.0.0.1 --port 8080 --strictPort"
  }
}
JSON
fi

npm i -D -E vite@5.4.8 @vitejs/plugin-react@4.3.1 typescript@5.5.4 @types/react@18.3.5 @types/react-dom@18.3.0 >/dev/null 2>&1 || true
npm i    -E react@18.3.1 react-dom@18.3.1 lucide-react@0.441.0 >/dev/null 2>&1 || true

# 4) Vite + TS config
[ -f vite.config.ts ] || cat > vite.config.ts <<TS
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins:[react()], server:{ host:"127.0.0.1", port:8080, strictPort:true }});
TS

[ -f tsconfig.json ] || cat > tsconfig.json <<JSON
{ "compilerOptions": {
    "target":"ES2020","lib":["ES2020","DOM"],"jsx":"react-jsx",
    "module":"ESNext","moduleResolution":"Bundler",
    "strict":true,"skipLibCheck":true
  },
  "include":["src"]
}
JSON

# 5) Entradas React (mount del cockpit exacto)
cat > src/main.tsx <<TS
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
createRoot(document.getElementById("root")!).render(<App />);
TS

cat > src/App.tsx <<TS
import React from "react";
import Cockpit from "./${REL_IMPORT}";
export default function App(){ return <Cockpit/>; }
TS

# 6) index.html con Tailwind CDN + pixel-lock
cat > index.html <<HTML
<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ECONEURA Cockpit</title>
<script>window.__ECONEURA_BEARER="SIMULATED_TOKEN";</script>
<script>tailwind = { config: { corePlugins: { preflight: true } } };</script>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html,body,#root{height:100%;margin:0}
  *{box-sizing:border-box}
  body{background:#f2f7fb;color:#0f172a;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
</style>
</head>
<body class="min-h-screen">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
HTML

# 7) Live Preview embebido (opcional)
cat > preview/preview.html <<HTML
<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ECONEURA – Preview</title><style>html,body,iframe{height:100%;margin:0;border:0}</style></head>
<body><iframe src="http://127.0.0.1:8080/"></iframe></body></html>
HTML
cat > .vscode/settings.json <<JSON
{ "livePreview.defaultPreviewPath": "/preview/preview.html",
  "livePreview.openPreviewTarget": "Embedded Browser",
  "livePreview.serverPort": 5500 }
JSON

# 8) Arranca Vite
nohup npm run dev >/tmp/econeura_vite.log 2>&1 &
# Espera hasta que responda
for i in $(seq 1 80); do
  sleep 0.25
  if curl -fsS http://127.0.0.1:8080/ | grep -q "ECONEURA Cockpit"; then ok=1; break; fi
done
[ "${ok:-0}" -eq 1 ] || { echo "❌ No cargo index.html (mira /tmp/econeura_vite.log)"; exit 1; }

echo "✅ Cockpit montado 1:1 y sirviendo en http://127.0.0.1:8080/"
echo "👉 VS Code: abre preview/preview.html → «Open with Live Preview» (embebido)"
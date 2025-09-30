#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# 0) Requisitos mínimos
command -v node >/dev/null || { echo "❌ Falta Node.js. Usa un devcontainer de Node o instala Node localmente."; exit 1; }
command -v npm  >/dev/null || { echo "❌ Falta npm."; exit 1; }

# ─────────────────────────────────────────────────────────────
# 1) Localizar/crear app web estándar con Vite+React+TS
ROOT="$(pwd)"
for d in apps/web web .; do
  if [ -f "$d/package.json" ] || [ -d "$d/src" ] || [ -f "$d/index.html" ]; then WEB_DIR="$d"; break; fi
done
WEB_DIR="${WEB_DIR:-apps/web}"
mkdir -p "$WEB_DIR"
cd "$WEB_DIR"

# ─────────────────────────────────────────────────────────────
# 2) package.json mínimo (no pisa si ya existe)
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

# ─────────────────────────────────────────────────────────────
# 3) Dependencias garantizadas (silencioso si ya estaban)
npm pkg set engines.node=">=18"
npm i -D -E vite @vitejs/plugin-react typescript @types/react @types/react-dom >/dev/null 2>&1 || true
npm i    -E react react-dom lucide-react >/dev/null 2>&1 || true

# ─────────────────────────────────────────────────────────────
# 4) Vite config + tsconfig (idempotentes)
[ -f vite.config.ts ] || cat > vite.config.ts <<TS
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins:[react()], server:{ host:"127.0.0.1", port:8080, strictPort:true }});
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

# ─────────────────────────────────────────────────────────────
# 5) Estructura React (NO pisa tu cockpit si ya existe)
mkdir -p src
[ -f src/main.tsx ] || cat > src/main.tsx <<TS
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
const el = document.getElementById("root")!;
createRoot(el).render(<App />);
TS

# App.tsx: si existe tu EconeuraCockpit.tsx lo usa; si no, deja placeholder claro
if [ ! -f src/App.tsx ]; then
  if [ -f src/EconeuraCockpit.tsx ] || [ -f src/EconeuraCockpit.repo.tsx ] || [ -f src/components/EconeuraCockpit.tsx ]; then
    CANDIDATE="$(ls src/EconeuraCockpit*.tsx src/components/EconeuraCockpit*.tsx 2>/dev/null | head -n1)"
    cat > src/App.tsx <<TS
import React from "react";
import Cockpit from "./$(basename "$CANDIDATE" )".replace(/^src\\//,"");
export default function App(){ return <Cockpit/>; }
TS
  else
    cat > src/App.tsx <<TS
import React from "react";
export default function App(){
  return <div style={{padding:16,fontFamily:"ui-sans-serif"}}>Coloca tu <code>src/EconeuraCockpit.tsx</code> aquí.</div>;
}
TS
  fi
fi

# ─────────────────────────────────────────────────────────────
# 6) index.html con Tailwind CDN (no pisa si ya existe)
if [ ! -f index.html ]; then
  cat > index.html <<HTML
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>ECONEURA Cockpit</title>
    <!-- Tailwind CDN para respetar el look & feel sin config adicional -->
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

# ─────────────────────────────────────────────────────────────
# 7) Arrancar Vite (si ya está, reutiliza). Esperar a que responda.
if ! curl -fsS http://127.0.0.1:8080/ >/dev/null 2>&1; then
  nohup npm run dev >/tmp/econeura_vite.log 2>&1 &
  for i in $(seq 1 60); do
    sleep 0.25
    if curl -fsS http://127.0.0.1:8080/ >/dev/null 2>&1; then break; fi
    [ $i -eq 60 ] && { echo "❌ Vite no respondió a tiempo. Revisa /tmp/econeura_vite.log"; exit 1; }
  done
fi

# ─────────────────────────────────────────────────────────────
# 8) Harness Live Preview (iframe 1:1 idéntico al cockpit servido por Vite)
mkdir -p preview
cat > preview/preview.html << "HTML"
<!doctype html><html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ECONEURA – Vista en VS Code</title>
<style>html,body,#wrap{height:100%;margin:0} iframe{border:0;width:100%;height:100%}
.bar{position:fixed;right:8px;top:8px;background:#ffffffcc;border:1px solid #e5e7eb;border-radius:10px;padding:6px 10px;font:12px ui-sans-serif,system-ui}
</style></head><body>
<div id="wrap"><iframe src="http://127.0.0.1:8080/"></iframe></div>
<div class="bar">ECONEURA • Cockpit 1:1 — fuente Vite: <code>http://127.0.0.1:8080/</code></div>
<script>window.__ECONEURA_BEARER=window.__ECONEURA_BEARER||"SIMULATED_TOKEN";</script>
</body></html>
HTML

# ─────────────────────────────────────────────────────────────
# 9) Mensaje final
echo
echo "✅ Cockpit servido (1:1):  http://127.0.0.1:8080/"
echo "✅ VS Code Live Preview:  abre  $PWD/preview/preview.html  → «Open with Live Preview»"
echo "ℹ️  Logs de Vite:         tail -f /tmp/econeura_vite.log"
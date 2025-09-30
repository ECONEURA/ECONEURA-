#!/bin/bash
set -euo pipefail

# 1) Precondiciones
command -v node >/dev/null || { echo "❌ Falta Node>=18"; exit 1; }
command -v npm  >/dev/null || { echo "❌ Falta npm"; exit 1; }

# 2) Localiza carpeta web
ROOT="$(pwd)"; for d in apps/web web .; do
  if [ -f "$d/package.json" ] || [ -d "$d/src" ] || [ -f "$d/index.html" ]; then WEB="$d"; break; fi
done; WEB="${WEB:-apps/web}"; mkdir -p "$WEB/src" "$WEB/.vscode" "$WEB/preview"; cd "$WEB"

# 3) package.json + versiones fijas
[ -f package.json ] || cat > package.json <<JSON
{ "name":"econeura-web","private":true,"type":"module",
  "scripts":{"dev":"vite --host 127.0.0.1 --port 8080 --strictPort","build":"vite build","preview":"vite preview --host 127.0.0.1 --port 8080 --strictPort"}
}
JSON
npm pkg set engines.node=">=18" >/dev/null
npm i -D -E vite@5.4.8 @vitejs/plugin-react@4.3.1 typescript@5.5.4 @types/react@18.3.5 @types/react-dom@18.3.0 >/dev/null 2>&1 || true
npm i    -E react@18.3.1 react-dom@18.3.1 lucide-react@0.441.0 >/dev/null 2>&1 || true

# 4) Vite + TS config
[ -f vite.config.ts ] || cat > vite.config.ts <<TS
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins:[react()], server:{ host:"127.0.0.1", port:8080, strictPort:true }});
TS
[ -f tsconfig.json ] || cat > tsconfig.json <<JSON
{ "compilerOptions": { "target":"ES2020","lib":["ES2020","DOM"],"jsx":"react-jsx","module":"ESNext","moduleResolution":"Bundler","strict":true,"skipLibCheck":true }, "include":["src"] }
JSON

# 5) Entradas React (no pisa tu cockpit)
[ -f src/main.tsx ] || cat > src/main.tsx <<TS
import React from "react"; import { createRoot } from "react-dom/client"; import App from "./App";
createRoot(document.getElementById("root")!).render(<App/>);
TS
if [ ! -f src/App.tsx ]; then
  if C=$(ls src/EconeuraCockpit*.tsx src/components/EconeuraCockpit*.tsx 2>/dev/null | head -n1); then
    MOD="\${C#src/}"; cat > src/App.tsx <<TS
import React from "react"; import Cockpit from "./$MOD";
export default function App(){ return <Cockpit/>; }
TS
  else
    cat > src/App.tsx <<TS
import React from "react";
export default function App(){ return <div style={{padding:16}}>Añade src/EconeuraCockpit.tsx</div>; }
TS
  fi
fi

# 6) index.html con Tailwind CDN + Pixel-Lock
cat > index.html <<HTML
<!doctype html><html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ECONEURA Cockpit</title>
<script>window.__ECONEURA_BEARER="SIMULATED_TOKEN";</script>
<script>
  // Fuerza preflight y orden determinista
  tailwind = { config: { corePlugins: { preflight: true } } };
</script>
<script src="https://cdn.tailwindcss.com"></script>
<style id="pixel-lock">
  html,body,#root{height:100%;margin:0}
  *{box-sizing:border-box}
  body{background:#f2f7fb;color:#0f172a;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
</style>
</head><body class="min-h-screen">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body></html>
HTML

# 7) Live Preview embebido (iframe directo a 8080)
cat > preview/preview.html <<HTML
<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ECONEURA – Preview</title><style>html,body,iframe{height:100%;margin:0;border:0}</style></head>
<body><iframe src="http://127.0.0.1:8080/"></iframe></body></html>
HTML
cat > .vscode/settings.json <<JSON
{ "livePreview.defaultPreviewPath": "/preview/preview.html", "livePreview.openPreviewTarget": "Embedded Browser", "livePreview.serverPort": 5500 }
JSON

# 8) Arranca Vite y espera
nohup npm run dev >/tmp/econeura_vite.log 2>&1 &
for i in $(seq 1 80); do sleep 0.25; curl -fsS http://127.0.0.1:8080/ >/dev/null && break; [ $i -eq 80 ] && { echo "❌ Vite no respondió. Mira /tmp/econeura_vite.log"; exit 1; }; done

echo "✅ Cockpit servido en http://127.0.0.1:8080/"
echo "👉 En VS Code: abre preview/preview.html y «Open with Live Preview» (embebido)."
#!/bin/bash
set -euo pipefail

# 1) Vars
APP_DIR="${APP_DIR:-web}" ; HOST=127.0.0.1 ; PORT=5173 ; LP_PORT=5500

# 2) Archivos VS Code + harness Live Preview (iframe al Vite dev server = paridad 1:1)
mkdir -p .vscode preview
cat > preview/preview.html <<EOF
<!doctype html><html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ECONEURA — Cockpit (Live Preview)</title>
<style>
  html,body{height:100%;margin:0;background:#f2f7fb}
  .wrap{position:fixed;inset:0;display:flex}
  iframe{flex:1;border:0;width:100%;height:100%}
  .badge{position:fixed;right:8px;bottom:8px;font:12px/1.1 system-ui;background:#0f172a;color:#fff;padding:6px 8px;border-radius:8px;opacity:.85}
</style>
<script>window.__ECONEURA_BEARER="SIMULATED_TOKEN";</script>
</head><body>
<div class="wrap"><iframe src="http://{{HOST}}:{{PORT}}/"></iframe></div>
<div class="badge">Live Preview ↔ Vite @ {{HOST}}:{{PORT}}</div>
</body></html>
EOF
sed -i "s/{{HOST}}/${HOST}/g; s/{{PORT}}/${PORT}/g" preview/preview.html

# 3) Config Live Preview (Microsoft) para abrir el harness por defecto
cat > .vscode/settings.json <<EOF
{
  "livePreview.port": ${LP_PORT},
  "livePreview.serverRoot": "\${workspaceFolder}",
  "livePreview.defaultPreviewPath": "/preview/preview.html",
  "livePreview.openPreviewTarget": "embedded",
  "livePreview.useWebView": true
}
EOF

# 4) Tareas VS Code: levantar Vite y abrir Live Preview (comando de la extensión)
cat > .vscode/tasks.json <<EOF
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "web:dev",
      "type": "shell",
      "command": "npm run dev -- --host ${HOST} --port ${PORT}",
      "options": { "cwd": "${APP_DIR}" },
      "isBackground": true,
      "problemMatcher": {
        "owner": "vite",
        "pattern": [{ "regexp": "." }],
        "background": {
          "activeOnStart": true,
          "beginsPattern": "Local:.*${HOST}:${PORT}",
          "endsPattern": "ready in .*"
        }
      }
    },
    {
      "label": "livePreview:start",
      "type": "shell",
      "command": "echo start",
      "problemMatcher": [],
      "options": { "env": {} },
      "inputs": []
    },
    {
      "label": "livePreview:open",
      "type": "shell",
      "command": "echo open",
      "problemMatcher": [],
      "options": { "env": {} }
    },
    {
      "label": "ECONEURA: Dev + LivePreview",
      "dependsOn": [
        "web:dev",
        "livePreview:open"
      ]
    }
  ],
  "inputs": [
    { "id": "lpStart", "type": "command", "command": "livePreview.startServer" },
    { "id": "lpOpen",  "type": "command", "command": "livePreview.openPreview",
      "args": { "path": "/preview/preview.html" } }
  ]
}
EOF

# 5) Dependencias mínimas y arranque del dev server
if [ -f "${APP_DIR}/package.json" ]; then
  cd "${APP_DIR}"
  if command -v pnpm >/dev/null 2>&1; then pnpm i; else npm i; fi
  # asegura script dev
  jq -e .scripts.dev package.json >/dev/null 2>&1 || \
    npx -y json -I -f package.json -e '"'scripts.dev'"="vite"'
  cd - >/dev/null
fi

# 6) Levanta Vite en background y espera a que esté listo
( cd "${APP_DIR}" && npm run dev -- --host ${HOST} --port ${PORT} ) >/dev/null 2>&1 & VPID=$!
sleep 1
for i in {1..60}; do
  curl -sf "http://${HOST}:${PORT}" >/dev/null 2>&1 && ok=1 && break || sleep .25
done
[ "${ok:-0}" -eq 1 ] || { echo "❌ Vite no levantó en ${HOST}:${PORT}"; kill ${VPID} || true; exit 1; }

# 7) Mensaje final: abre Live Preview embebido (un clic, F1 o atajo)
echo
echo "✅ Cockpit 1:1 listo."
echo "   • Dev:        http://${HOST}:${PORT}/"
echo "   • LivePreview: abre F1 → \"Live Preview: Start Server\" (se abrirá /preview/preview.html)"
echo "   • O usa: Terminal → Run Task → \"ECONEURA: Dev + LivePreview\""
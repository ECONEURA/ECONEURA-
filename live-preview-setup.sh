#!/usr/bin/env bash
set -Eeuo pipefail; IFS=$'\n\t'

echo "🎯 Configurando ECONEURA Cockpit para Live Preview de Microsoft"
echo "============================================================"

# 1. Verificar dependencias
need(){ command -v "$1" >/dev/null || { echo "❌ Falta $1"; exit 1; }; }
need python3; need node; need npm

# 2. Configurar VS Code para Live Preview
echo "📝 Configurando VS Code settings..."
mkdir -p .vscode
cat > .vscode/settings.json << 'JSON'
{
  "livePreview.defaultPreviewPath": "/apps/web/dist/index.html",
  "livePreview.portNumber": 5500,
  "livePreview.host": "127.0.0.1",
  "livePreview.openPreviewTarget": "embeddedPreview",
  "livePreview.serverRoot": "/workspaces/ECONEURA-",
  "files.associations": {
    "*.tsx": "typescriptreact",
    "*.jsx": "javascriptreact"
  }
}
JSON

# 3. Configurar launch.json para debugging
cat > .vscode/launch.json << 'JSON'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch API Server",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api_server.py",
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}"
    },
    {
      "name": "Debug React App",
      "type": "chrome",
      "request": "launch",
      "url": "http://127.0.0.1:5500",
      "webRoot": "${workspaceFolder}/apps/web/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
JSON

# 4. Preparar aplicación web
echo "🏗️  Construyendo aplicación web..."
cd apps/web
npm install >/dev/null 2>&1
# Solo intentar build si no hay errores críticos
if npm run build >/dev/null 2>&1; then
  echo "✅ Build exitoso"
else
  echo "⚠️  Build falló, usando archivos existentes"
fi
cd ../..

# 5. Configurar index.html para Live Preview
echo "🔧 Configurando HTML para Live Preview..."
HTML_FILE="apps/web/dist/index.html"
if [ ! -f "$HTML_FILE" ]; then
  mkdir -p apps/web/dist
  cat > "$HTML_FILE" << 'HTML'
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ECONEURA Cockpit - Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#f2f7fb]">
  <div id="root">
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">🚀 ECONEURA Cockpit</h1>
        <p class="text-lg text-gray-600 mb-8">Cargando interfaz...</p>
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  </div>
  <script>
    // Configuración para Live Preview
    window.__ECONEURA_GW_URL = "http://127.0.0.1:8080/api";
    window.__ECONEURA_BEARER = "SIMULATED_TOKEN";

    // Auto-login para desarrollo
    window.dispatchEvent(new CustomEvent("auth:login"));

    // Mostrar estado de conexión
    setTimeout(() => {
      fetch(window.__ECONEURA_GW_URL + '/health')
        .then(r => r.json())
        .then(data => {
          console.log('✅ API conectada:', data);
          document.querySelector('#root').innerHTML = `
            <div class="flex items-center justify-center min-h-screen">
              <div class="text-center">
                <h1 class="text-4xl font-bold text-green-600 mb-4">✅ API Conectada</h1>
                <p class="text-lg text-gray-600 mb-4">Servidor: ${data.server || 'ECONEURA'} v${data.version || '1.0'}</p>
                <p class="text-sm text-gray-500">Timestamp: ${new Date(data.ts).toLocaleString()}</p>
                <button onclick="testAgent()" class="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  🧪 Probar Agente
                </button>
                <div id="test-result" class="mt-4"></div>
              </div>
            </div>
          `;
        })
        .catch(err => {
          console.error('❌ Error conectando API:', err);
          document.querySelector('#root').innerHTML = `
            <div class="flex items-center justify-center min-h-screen">
              <div class="text-center">
                <h1 class="text-4xl font-bold text-red-600 mb-4">❌ API No Conectada</h1>
                <p class="text-lg text-gray-600 mb-4">Asegúrate de que el servidor esté corriendo</p>
                <p class="text-sm text-gray-500">Error: ${err.message}</p>
                <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  🔄 Reintentar
                </button>
              </div>
            </div>
          `;
        });

      // Función para probar agente
      window.testAgent = function() {
        fetch(window.__ECONEURA_GW_URL + '/invoke/neura-1', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + window.__ECONEURA_BEARER,
            'X-Route': 'local',
            'X-Correlation-Id': 'test-' + Date.now(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ input: 'Hola desde Live Preview!' })
        })
        .then(r => r.json())
        .then(data => {
          document.querySelector('#test-result').innerHTML = `
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <strong>✅ Agente respondió:</strong><br>
              ID: ${data.id}<br>
              OK: ${data.ok}<br>
              Echo: ${JSON.stringify(data.echo)}
            </div>
          `;
        })
        .catch(err => {
          document.querySelector('#test-result').innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>❌ Error:</strong> ${err.message}
            </div>
          `;
        });
      };
    }, 1000);
  </script>
</body>
</html>
HTML
fi

# 6. Iniciar API server
echo "🚀 Iniciando servidor API..."
pkill -f "apps/api_server.py" 2>/dev/null || true
python3 apps/api_server.py >/dev/null 2>&1 &
API_PID=$!

# 7. Esperar que esté listo
echo "⏳ Esperando que el API esté listo..."
for i in {1..30}; do
  if curl -fsS http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# 8. Verificar funcionamiento
if curl -fsS http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
  echo ""
  echo "🎉 ¡Configuración completada!"
  echo "=============================="
  echo "✅ API Server corriendo en: http://127.0.0.1:8080"
  echo "✅ Live Preview configurado en: http://127.0.0.1:5500"
  echo ""
  echo "📋 Próximos pasos:"
  echo "1. Abre apps/web/dist/index.html en VS Code"
  echo "2. Haz clic derecho → 'Open with Live Preview'"
  echo "3. O usa Ctrl+Shift+P → 'Live Preview: Start Server'"
  echo ""
  echo "🔧 Comandos útiles:"
  echo "- Ver logs API: ps aux | grep api_server"
  echo "- Detener API: pkill -f 'apps/api_server.py'"
  echo "- Reiniciar: ./live-preview-setup.sh"
  echo ""
  echo "🎯 El cockpit se conectará automáticamente al API!"
else
  echo "❌ Error: El API server no pudo iniciarse"
  exit 1
fi
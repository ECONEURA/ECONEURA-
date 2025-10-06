# ECONEURA Cockpit - Live Preview Setup

## 🎯 Configuración Completa con Live Preview de Microsoft

El proyecto está configurado para usar **Live Preview** de Microsoft, una
extensión integrada de VS Code que permite previsualizar aplicaciones web
directamente en el editor.

## ✅ Estado Actual

- ✅ **API Server**: Corriendo en `http://127.0.0.1:8080`
- ✅ **Live Preview**: Configurado en `http://127.0.0.1:5500`
- ✅ **VS Code Settings**: Configurados automáticamente
- ✅ **HTML Interface**: Lista con auto-conexión al API

## 🚀 Cómo Usar

### 1. Verificar Instalación

Asegúrate de tener la extensión **"Live Preview"** de Microsoft instalada:

- Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
- Busca: "Extensions: Install Extension"
- Instala: `ms-vscode.live-server`

### 2. Iniciar Live Preview

**Opción A - Archivo específico:**

- Abre `apps/web/dist/index.html` en VS Code
- Haz clic derecho en el archivo
- Selecciona: **"Open with Live Preview"**

**Opción B - Comando:**

- Presiona `Ctrl+Shift+P`
- Busca: **"Live Preview: Start Server"**
- Selecciona el archivo `apps/web/dist/index.html`

### 3. Ver la Interfaz

- Se abrirá un panel integrado en VS Code
- La interfaz se conectará automáticamente al API
- Verás el estado de conexión y podrás probar agentes

## 🔧 Comandos Útiles

```bash
# Ver estado del API
curl http://127.0.0.1:8080/api/health

# Probar agente
curl -X POST http://127.0.0.1:8080/api/invoke/neura-1 \
  -H "Authorization: Bearer SIMULATED_TOKEN" \
  -H "X-Route: local" \
  -H "X-Correlation-Id: test-123" \
  -H "Content-Type: application/json" \
  -d '{"input":"Hola!"}'

# Reiniciar configuración
./live-preview-setup.sh

# Detener API server
pkill -f "apps/api_server.py"
```

## 📁 Archivos Importantes

- `.vscode/settings.json` - Configuración de Live Preview
- `.vscode/launch.json` - Configuración de debugging
- `apps/api_server.py` - Servidor API con CORS
- `apps/web/dist/index.html` - Interfaz HTML con auto-conexión
- `live-preview-setup.sh` - Script de configuración

## 🎨 Características

- **Vista integrada**: Preview directamente en VS Code
- **Auto-conexión**: API se conecta automáticamente
- **Hot reload**: Cambios se reflejan en tiempo real
- **Debugging**: Configurado para debugging de React y Python
- **CORS completo**: Headers configurados para desarrollo

## 🔄 Desarrollo

Para desarrollo continuo:

1. El API server se mantiene corriendo en background
2. Live Preview maneja los archivos estáticos
3. Los cambios en HTML/JS se reflejan automáticamente
4. Usa las herramientas de debugging de VS Code

## 🐛 Troubleshooting

**Si Live Preview no funciona:**

- Verifica que la extensión esté instalada
- Reinicia VS Code
- Ejecuta: `./live-preview-setup.sh`

**Si el API no responde:**

- Verifica: `ps aux | grep api_server`
- Reinicia: `pkill -f api_server && python3 apps/api_server.py`

¡El cockpit está listo para desarrollo con Live Preview! 🎉

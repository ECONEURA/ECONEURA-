# ECONEURA Cockpit - Simple Browser Setup (SIN BUILD)

## 🎯 **Cockpit 1:1 en VS Code Simple Browser**

Configuración completa para ejecutar el cockpit **sin build, sin Vite**,
directamente en el navegador usando Babel para transpilar TSX en tiempo real.

## ✅ **Características**

- ✅ **Sin build process** - Componente TSX se ejecuta directamente
- ✅ **Babel in-browser** - Transpilación TSX → JS en tiempo real
- ✅ **Import maps** - React y dependencias desde CDN
- ✅ **Simple Browser integrado** - Vista directamente en VS Code
- ✅ **API completa** - Health e invoke endpoints con CORS
- ✅ **Configuración automática** - Gateway y tokens pre-configurados

## 🚀 **Cómo Usar**

### **Ejecución Automática**

```bash
./cockpit-simple-browser.sh
```

### **Ejecución Manual**

```bash
# 1. Ejecutar el script
./cockpit-simple-browser.sh

# 2. Abrir Simple Browser en VS Code
# F1 → Simple Browser → URL: http://127.0.0.1:8080/
```

## 🔧 **Arquitectura**

### **HTML Generado** (`apps/web/dist/index.html`)

- **Tailwind CSS** desde CDN
- **Import Map** para React y dependencias
- **Babel Standalone** para transpilar TSX
- **Componente TSX** insertado tal cual
- **Configuración automática** de gateway y tokens

### **API Server** (`apps/api_server.py`)

- **CORS completo** para requests del navegador
- **Endpoints**: `/api/health`, `/api/invoke/:id`
- **Validación** de headers (Authorization, X-Route, X-Correlation-Id)
- **Simulación** de respuestas de agentes

## 📁 **Archivos Generados**

```
apps/web/dist/
├── index.html          # HTML con TSX + Babel
└── ...

apps/
└── api_server.py      # API unificada con CORS

cockpit-simple-browser.sh  # Script de configuración
```

## 🌐 **URLs y Endpoints**

- **Interfaz Web**: `http://127.0.0.1:8080/`
- **Health Check**: `http://127.0.0.1:8080/api/health`
- **Invoke Agent**: `POST http://127.0.0.1:8080/api/invoke/{agentId}`

## 🧪 **Testing**

```bash
# Health check
curl http://127.0.0.1:8080/api/health

# Probar agente
curl -X POST http://127.0.0.1:8080/api/invoke/neura-1 \
  -H "Authorization: Bearer test-token" \
  -H "X-Route: local" \
  -H "X-Correlation-Id: test-123" \
  -H "Content-Type: application/json" \
  -d '{"input":"Hola desde Simple Browser!"}'
```

## 🎨 **Ventajas**

- ✅ **Desarrollo instantáneo** - Sin esperar builds
- ✅ **Debugging visual** - Errores de TSX visibles en consola
- ✅ **Hot reload natural** - F5 para recargar cambios
- ✅ **Sin dependencias complejas** - Solo navegador + Babel
- ✅ **Integración VS Code** - Simple Browser integrado

## 🔄 **Desarrollo**

1. **Edita el TSX** en `apps/web/src/EconeuraCockpit.tsx`
2. **Ejecuta el script** para regenerar HTML
3. **F5 en Simple Browser** para ver cambios
4. **Debug en consola** del navegador para errores

## 🐛 **Troubleshooting**

**Si no carga el componente:**

- Verifica que Babel esté cargando en Network tab
- Revisa errores de TSX en Console
- Confirma que el import map esté correcto

**Si API no responde:**

- Verifica que el servidor esté corriendo: `ps aux | grep python3`
- Reinicia: `pkill -f api_server && ./cockpit-simple-browser.sh`

**Si CORS errors:**

- El API incluye headers CORS completos
- Verifica que uses `/api` como base URL (no `http://127.0.0.1:8080/api`)

¡El cockpit está listo para desarrollo inmediato en Simple Browser! 🚀

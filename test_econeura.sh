#!/bin/bash
# Script simple para probar Econeura de manera incremental

set -e

echo "🚀 Iniciando pruebas incrementales de Econeura..."

# Función para verificar puerto libre
is_port_free() {
    ! nc -z 127.0.0.1 "$1" 2>/dev/null
}

# Función para esperar que un servicio esté listo
wait_for_service() {
    local url="$1"
    local max_attempts="${2:-30}"
    local attempt=1

    echo "Esperando que $url esté listo..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ $url está listo"
            return 0
        fi
        echo "Intento $attempt/$max_attempts..."
        sleep 1
        ((attempt++))
    done

    echo "❌ $url no respondió después de $max_attempts intentos"
    return 1
}

# 1. Verificar puertos libres
echo "📋 Verificando puertos libres..."
if ! is_port_free 8080; then
    echo "⚠️  Puerto 8080 ocupado, intentando matar procesos..."
    pkill -f "python3.*server.py" || true
    sleep 2
fi

if ! is_port_free 5173; then
    echo "⚠️  Puerto 5173 ocupado, intentando matar procesos..."
    pkill -f "vite" || true
    sleep 2
fi

# 2. Iniciar API
echo "🔧 Iniciando API server..."
cd /workspaces/ECONEURA-/apps/api_py
python3 server.py &
API_PID=$!

# 3. Esperar que API esté listo
if wait_for_service "http://127.0.0.1:8080/api/health"; then
    echo "📊 Probando endpoints del API..."

    # Health check
    HEALTH_RESP=$(curl -s http://127.0.0.1:8080/api/health)
    echo "Health response: $HEALTH_RESP"

    # Probar invoke endpoint
    INVOKE_RESP=$(curl -s -X POST http://127.0.0.1:8080/api/invoke/neura-1 \
        -H "Authorization: Bearer test-token" \
        -H "X-Route: test" \
        -H "X-Correlation-Id: test-123" \
        -H "Content-Type: application/json" \
        -d '{"input":"test"}')
    echo "Invoke response: $INVOKE_RESP"

    echo "✅ API tests completados"
else
    echo "❌ API no está respondiendo"
    kill $API_PID 2>/dev/null || true
    exit 1
fi

# 4. Iniciar frontend
echo "🌐 Iniciando frontend..."
cd /workspaces/ECONEURA-/apps/web
npm run dev &
WEB_PID=$!

# 5. Esperar que frontend esté listo
if wait_for_service "http://127.0.0.1:5173"; then
    echo "✅ Frontend está listo en http://127.0.0.1:5173"

    # Probar que el proxy funciona
    echo "🔗 Probando proxy API desde frontend..."
    PROXY_RESP=$(curl -s http://127.0.0.1:5173/api/health)
    echo "Proxy response: $PROXY_RESP"

    echo "✅ Todos los servicios están funcionando!"
    echo ""
    echo "🌟 Econeura está listo:"
    echo "  - API: http://127.0.0.1:8080"
    echo "  - Web: http://127.0.0.1:5173"
    echo ""
    echo "Presiona Ctrl+C para detener..."

    # Mantener ejecutándose
    wait
else
    echo "❌ Frontend no está respondiendo"
    kill $API_PID $WEB_PID 2>/dev/null || true
    exit 1
fi

# Cleanup
trap 'echo "🛑 Deteniendo servicios..."; kill $API_PID $WEB_PID 2>/dev/null || true; exit 0' INT TERM
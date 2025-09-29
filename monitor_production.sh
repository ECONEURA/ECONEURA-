#!/usr/bin/env bash
# ECONEURA · Monitoring de Producción (Health, Logs, Metrics)
set -euo pipefail; IFS=$'\n\t'

# Config
API_URL="${API_URL:-https://econeura-api-dev.azurewebsites.net}"
WEB_URL="${WEB_URL:-https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net}"
INTERVAL="${INTERVAL:-60}"

echo "📊 Starting Production Monitoring (interval: ${INTERVAL}s)"

# Función de monitoring
monitor() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Monitoring ECONEURA"

  # API Health
  if curl -f --max-time 10 "$API_URL/api/health" >/dev/null 2>&1; then
    echo "✅ API Health: OK"
  else
    echo "❌ API Health: FAIL"
  fi

  # Web Health (si hay endpoint)
  if curl -f --max-time 10 "$WEB_URL" >/dev/null 2>&1; then
    echo "✅ Web Health: OK"
  else
    echo "❌ Web Health: FAIL"
  fi

  # NEURA endpoints
  ok_count=0
  for i in {1..10}; do
    if curl -f --max-time 5 -XPOST "$API_URL/api/invoke/neura-$i" \
      -H "Authorization: Bearer monitor" \
      -H "X-Route: monitor" \
      -H "X-Correlation-Id: mon-$i" \
      -H "Content-Type: application/json" \
      -d '{"input":""}' >/dev/null 2>&1; then
      ok_count=$((ok_count + 1))
    fi
  done
  echo "📈 NEURA Status: $ok_count/10 OK"

  echo "---"
}

# Loop infinito
while true; do
  monitor
  sleep "$INTERVAL"
done
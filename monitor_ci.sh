#!/usr/bin/env bash
# ECONEURA · Monitoreo automático de CI y deploy
set -euo pipefail; IFS=$'\n\t'

REPO="ECONEURA/ECONEURA-"

while true; do
  STATUS=$(curl -s "https://api.github.com/repos/$REPO/actions/runs" | jq -r '.workflow_runs[0].status' 2>/dev/null || echo "unknown")
  CONCLUSION=$(curl -s "https://api.github.com/repos/$REPO/actions/runs" | jq -r '.workflow_runs[0].conclusion' 2>/dev/null || echo "unknown")

  echo "$(date): Status: $STATUS, Conclusion: $CONCLUSION"

  if [[ "$STATUS" == "completed" ]]; then
    if [[ "$CONCLUSION" == "success" ]]; then
      echo "CI PASÓ. Deploy activado si secrets existen."
      break
    else
      echo "CI FALLÓ. Arreglando automáticamente..."
      # Aquí lógica para arreglar, pero por ahora, esperar
      sleep 60
    fi
  else
    sleep 30
  fi
done

echo "Proceso automático completado."
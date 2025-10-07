#!/usr/bin/env bash
set -euo pipefail

REPO="ECONEURA/ECONEURA-"
WORKFLOW_FILE="azure-provision.yml"
PP_WORKFLOW_FILE="provision-postprocess.yml"

echo "== Monitor de Azure provision (Fase D) workflow =="
echo "Repositorio: $REPO"
echo "Workflow file: $WORKFLOW_FILE"

# último run conocido
LAST=$(curl -sS "https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW_FILE/runs?per_page=1" | jq -r ".workflow_runs[0].id // 0")
echo "Último run conocido id: $LAST"

echo "Ahora lanza el workflow 'Azure provision (Fase D)' desde la UI: Actions → Azure provision (Fase D) → Run workflow"

START_TS_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
START_TS_EPOCH=$(date +%s)
TIMEOUT=$((30*60))
END_TS=$((START_TS_EPOCH + TIMEOUT))

echo "Monitorizando nuevo run (timeout 30m)..."
RUN_ID=0
while [ "$(date +%s)" -le "$END_TS" ]; do
  sleep 5
  LATEST_ID=$(curl -sS "https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW_FILE/runs?per_page=1" | jq -r ".workflow_runs[0].id // 0")
  if [ "$LATEST_ID" != "0" ] && [ "$LATEST_ID" != "$LAST" ]; then
    RUN_ID=$LATEST_ID
    echo "Nuevo run detectado: $RUN_ID"
    break
  fi
done

if [ "$RUN_ID" -eq 0 ]; then
  echo "No se detectó ningún run nuevo en ${TIMEOUT}s. Abortando."
  exit 2
fi

# Esperar a que termine
echo "Monitoreando run $RUN_ID hasta que termine..."
while true; do
  sleep 6
  read -r STATUS CONCL < <(curl -sS "https://api.github.com/repos/$REPO/actions/runs/$RUN_ID" | jq -r '.status, .conclusion')
  echo "[$(date +%T)] status=$STATUS conclusion=$CONCL"
  if [ "$STATUS" = "completed" ]; then
    echo "Run $RUN_ID completado con conclusion=$CONCL"
    break
  fi
done

# Mostrar jobs y artifacts
echo
echo "=== Jobs resumen ==="
curl -sS "https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/jobs" | jq -r ".jobs[] | {id:.id, name:.name, status:.status, conclusion:.conclusion}"

echo
echo "=== Artifacts list for run $RUN_ID ==="
curl -sS "https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/artifacts" | jq -r ".artifacts[] | {id:.id, name:.name, size_in_bytes:.size_in_bytes, url:.archive_download_url}" || true

if [ "$CONCL" != "success" ]; then
  echo "El run de Fase D no tuvo éxito (conclusion=$CONCL). Revisa logs en GitHub Actions."
  exit 0
fi

# Esperar por el postprocess
echo "El run de Fase D finalizó con éxito. Buscando 'Provision postprocess (Fase E)' (timeout 10m)..."
PP_TIMEOUT=$((10*60))
PP_END=$(( $(date +%s) + PP_TIMEOUT ))
PP_RUN=0
while [ "$(date +%s)" -le "$PP_END" ]; do
  sleep 5
  # Listar últimos 20 runs del postprocess y buscar alguno creado después del START_TS_ISO
  PP_RUN_CANDIDATE=$(curl -sS "https://api.github.com/repos/$REPO/actions/workflows/$PP_WORKFLOW_FILE/runs?per_page=20" | jq -r ".workflow_runs[] | select(.created_at >= \"$START_TS_ISO\") | .id" | head -n1 || true)
  if [ -n "$PP_RUN_CANDIDATE" ]; then
    PP_RUN=$PP_RUN_CANDIDATE
    echo "Postprocess run detectado: $PP_RUN"
    break
  fi
done

if [ "$PP_RUN" -eq 0 ]; then
  echo "No se detectó run de postprocess en el timeout. Puedes lanzar 'Provision postprocess (Fase E)' manualmente en Actions." 
  exit 0
fi

# Esperar a que termine postprocess
echo "Monitoreando postprocess run $PP_RUN hasta completarse..."
while true; do
  sleep 5
  read -r PSTATUS PCONCL < <(curl -sS "https://api.github.com/repos/$REPO/actions/runs/$PP_RUN" | jq -r '.status, .conclusion')
  echo "[$(date +%T)] postprocess status=$PSTATUS conclusion=$PCONCL"
  if [ "$PSTATUS" = "completed" ]; then
    echo "Postprocess completed with conclusion=$PCONCL"
    break
  fi
done

echo "Listing jobs for postprocess..."
curl -sS "https://api.github.com/repos/$REPO/actions/runs/$PP_RUN/jobs" | jq -r ".jobs[] | {id:.id, name:.name, status:.status, conclusion:.conclusion}"

echo "Monitor finished."

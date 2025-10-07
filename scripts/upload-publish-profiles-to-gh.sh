#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "Instala GitHub CLI (gh) y autentícate con 'gh auth login'"
  exit 1
fi

if [[ ! -f publish_profile_web.xml || ! -f publish_profile_api.xml ]]; then
  echo "Descarga los artefactos del workflow y coloca 'publish_profile_web.xml' y 'publish_profile_api.xml' en esta carpeta"
  exit 2
fi

echo "Subiendo publish_profile_web.xml a secreto AZURE_WEBAPP_PUBLISH_PROFILE_WEB"
gh secret set AZURE_WEBAPP_PUBLISH_PROFILE_WEB --body "$(cat publish_profile_web.xml)"

echo "Subiendo publish_profile_api.xml a secreto AZURE_WEBAPP_PUBLISH_PROFILE_API"
gh secret set AZURE_WEBAPP_PUBLISH_PROFILE_API --body "$(cat publish_profile_api.xml)"

echo "Hecho. Ahora los secretos están en el repositorio. Ajusta tus workflows para leerlos si es necesario."

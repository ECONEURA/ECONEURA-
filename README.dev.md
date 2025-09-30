Cockpit (dev) - arranque rápido
-------------------------------

Arrancar (PowerShell):

pwsh -NoProfile -ExecutionPolicy Bypass -File .\\.dev\\cockpit\\setup-cockpit.ps1

Probar (smoke):

pwsh -NoProfile -Command "Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8080/ | Select-String '<div id=\"root\"'"

Parar (por PID):

pwsh -NoProfile -Command "Stop-Process -Id <PID> -Force"


## Integración continua (CI) 🚀

Puedes ver el estado del workflow de cockpit en GitHub Actions mediante este badge:

[![cockpit CI](https://github.com/ECONEURA/ECONEURA-/actions/workflows/cockpit-ci.yml/badge.svg)](https://github.com/ECONEURA/ECONEURA-/actions/workflows/cockpit-ci.yml)

El PR en `feature/cockpit-dev-setup` contiene los scripts y pruebas para arrancar el cockpit en local.

Crear PR desde la máquina
------------------------

Si quieres crear el PR automáticamente desde tu entorno local (sin usar la UI), exporta un token de GitHub con
permisos de repositorio en `GITHUB_TOKEN` y ejecuta:

```powershell
Set-Location -LiteralPath "C:\Users\Usuario\ECONEURA-\ECONEURA-"
$env:GITHUB_TOKEN = "<YOUR_TOKEN_HERE>"
.
\scripts\create-pr.ps1
```

El script creará un PR draft usando los valores por defecto. Puedes editar el archivo `.git/PR_DRAFT_BODY.md` para
personalizar el cuerpo antes de ejecutar.


Cockpit (dev) - arranque rápido
-------------------------------

Arrancar (PowerShell):

pwsh -NoProfile -ExecutionPolicy Bypass -File .\\.dev\\cockpit\\setup-cockpit.ps1

Probar (smoke):

pwsh -NoProfile -Command "Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8080/ | Select-String '<div id=\"root\"'"

Parar (por PID):

pwsh -NoProfile -Command "Stop-Process -Id <PID> -Force"


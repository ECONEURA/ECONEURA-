# PR listo para la rama feature/cockpit-dev-setup

Archivos clave cambiados en la rama: `.github/workflows/*.yml`,
`.dev/cockpit/*`, `README.dev.md`, `scripts/create-pr.ps1`.

Patch generado comparando `origin/main` con la rama actual:

.github/workflows/feature-cockpit-changes.patch

Cómo crear el PR (opciones):

1. Crear PR vía UI (rápido):

   https://github.com/ECONEURA/ECONEURA-/compare/main...feature/cockpit-dev-setup?expand=1

2. Crear PR vía script PowerShell (requiere PAT en GITHUB_TOKEN):

   ```powershell
   Set-Location -LiteralPath "C:\Users\Usuario\ECONEURA-\ECONEURA-"
   $env:GITHUB_TOKEN = "<YOUR_TOKEN_HERE>"
   .\scripts\create-pr.ps1
   ```

3. Aplicar o revisar el parche localmente:

   ```bash
   git apply .github/workflows/feature-cockpit-changes.patch --check
   git apply .github/workflows/feature-cockpit-changes.patch
   ```

Notas:

- Si necesitas que cree el PR automáticamente desde aquí, exporta `GITHUB_TOKEN`
  en tu entorno y avísame; puedo ejecutarlo.

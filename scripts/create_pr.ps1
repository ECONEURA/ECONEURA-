param(
    [string]$Branch = 'feat/coverage-enforcement',
    [string]$Base = 'main',
    [string]$Repo = 'ECONEURA/ECONEURA-'
)

$title = 'feat(coverage): repo-level coverage gate + ignore generated files'
$body = @'
- Qué hace:
  - Añade soporte para gate de cobertura repo-level, múltiples reporteros (v8/istanbul/lcov) y exclusiones para archivos generados/backups.
  - Añade shims ESM/CJS para react/jsx-runtime y react/jsx-dev-runtime en apps/web/test/shims/.
  - Ajusta apps/web/vitest.config.ts y lazy-load de App en apps/web/src/main.tsx para estabilizar tests.
- Pruebas: ejecuté la suite localmente: 489 tests pasaron, 0 fallos.
'@

Write-Host "Creating PR: $Repo $Branch -> $Base`nTitle: $title`n"

# Check gh CLI
$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($gh) {
    try {
        gh auth status --hostname github.com > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "gh CLI authenticated. Creating PR..."
            $tmp = [System.IO.Path]::GetTempFileName()
            $tmp = [System.IO.Path]::ChangeExtension($tmp, '.md')
            $body | Out-File -FilePath $tmp -Encoding UTF8
            $result = gh pr create --repo $Repo --base $Base --head $Branch --title "$title" --body-file $tmp 2>&1
            Write-Host $result
            if ($result -match 'https?://\S+/pull/\d+') {
                $m = $Matches[0]
                Write-Host "PR creada: $m"
            } else {
                Write-Host "gh pr create respondió pero no pude detectar la URL en la salida. Revisa la salida anterior."
            }
            Remove-Item $tmp -ErrorAction SilentlyContinue
            exit 0
        } else {
            Write-Host "gh CLI encontrada pero no autenticada. Ejecuta: gh auth login" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error verificando gh auth: $_" -ForegroundColor Red
    }
} else {
    Write-Host "gh CLI no encontrada." -ForegroundColor Yellow
}

# Fallback: open compare URL with prefilled title/body
$encTitle = [uri]::EscapeDataString($title)
$encBody = [uri]::EscapeDataString($body)
$url = "https://github.com/$Repo/compare/$Base...$Branch?expand=1&title=$encTitle&body=$encBody"
Write-Host "Abriendo URL para crear PR manualmente:" -ForegroundColor Green
Write-Host $url
Start-Process $url
exit 0

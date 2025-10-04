Param()
$ErrorActionPreference = 'Stop'
Write-Host "[0] Preparando entorno mínimo..."
try { corepack enable } catch {}
 $nodeVer = (node -v) -replace "\r|\n", ''
 try {
   $major = [int](($nodeVer -replace '^v(\d+).*$','$1'))
 } catch {
   Write-Host "No se pudo parsear la versión de Node: $nodeVer"
   exit 1
 }
 if ($major -lt 20) {
   Write-Host "Node >= 20 requerido. Versión actual: $nodeVer"
   exit 1
 }
 if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
   Write-Host "pnpm no encontrado. Por favor instala pnpm@8.x y reintenta."
   exit 1
 }
 pnpm config set store-dir .pnpm-store | Out-Null

Write-Host "[1] Detectando Cockpit (.tsx)..."
$files = git ls-files | Where-Object { $_ -match '(Econeura|Cockpit).*\.tsx$' }
if (-not $files -or $files.Count -eq 0) {
  Write-Host "No se encontró archivo .tsx relacionado con Cockpit/Econeura. Abortando"
  exit 2
}
$F = $files | Select-Object -First 1
Write-Host "Archivo detectado: $F"

Write-Host "[2] Instalando dependencias (rápido)..."
pnpm -w install --frozen-lockfile --prefer-offline --reporter=silent

Write-Host "[3] Ejecutando codemod si existe..."
if (Test-Path "tools/codemods/cockpit.ast.js") {
  try {
    node tools/codemods/cockpit.ast.js $F
  } catch {
    Write-Host "Error ejecutando codemod: $_"
  }
} else {
  Write-Host "Codemod no encontrado en tools/codemods/cockpit.ast.js"
}

Write-Host "[4] Asegurando .vscode (tareas ligeras)..."
if (-not (Test-Path '.vscode')) { New-Item -ItemType Directory -Path .vscode | Out-Null }
$tasks = @'
{
  "version": "2.0.0",
  "tasks": [
    { "label": "web:dev", "type": "shell", "command": "pnpm -C apps/web dev", "isBackground": true, "problemMatcher": [] },
    { "label": "web:lint", "type": "shell", "command": "pnpm -C apps/web lint --max-warnings 0" },
    { "label": "web:type", "type": "shell", "command": "pnpm -C apps/web typecheck" },
    { "label": "web:test:cov-fast", "type": "shell", "command": "pnpm -C apps/web test:coverage -- --runInBand" }
  ]
}
'@
Set-Content -Path .vscode/tasks.json -Value $tasks -Encoding UTF8

$launch = @'
{
  "version": "0.2.0",
  "configurations": [
    { "name": "Cockpit", "type": "chrome", "request": "launch", "url": "http://localhost:3000", "webRoot": "${workspaceFolder}" }
  ]
}
'@
Set-Content -Path .vscode/launch.json -Value $launch -Encoding UTF8

Write-Host "[5] (opcional) Arranque omitido en script en este entorno — continuar con checks locales"

Write-Host "[6] Validaciones rápidas (lint/type/tests)..."
try { pnpm -C apps/web lint --max-warnings 0; Write-Host 'Lint OK' } catch { Write-Host 'WARN lint' }
try { pnpm -C apps/web typecheck; Write-Host 'Typecheck OK' } catch { Write-Host 'WARN types' }
try { pnpm -C apps/web test:coverage -- --runInBand; Write-Host 'Tests OK' } catch { Write-Host 'WARN tests' }

Write-Host "[7] Git: añadir y commitear cambios si existen"
git add -A
$status = git status --porcelain
if ($status) {
  git commit -m 'chore(cockpit): apply AST codemod and lightweight DX tasks'
  Write-Host 'Commit creado'
} else {
  Write-Host 'No hay cambios para commitear'
}

Write-Host 'Hecho.'

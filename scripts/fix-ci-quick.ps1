param(
  [string]$RepoPath = 'C:\Users\Usuario\ECONEURA-\ECONEURA-',
  [switch]$Push,           # añade -Push para empujar
  [switch]$CreatePR        # añade -CreatePR para abrir PR (requiere gh autenticado)
)

$ErrorActionPreference='Stop'; Set-StrictMode -Version Latest

function Need($cmd){ if(-not (Get-Command $cmd -ErrorAction SilentlyContinue)){ throw "❌ Falta '$cmd' en PATH" } }
Need git

Push-Location $RepoPath
Write-Host "`n▶ Repo: $((git rev-parse --show-toplevel) 2>$null)"

# 0) Pre-flight de lectura (no cambia nada)
git fetch origin --prune --tags | Out-Null
$activeBranch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "• Rama activa: $activeBranch"

# 1) Crear rama de trabajo
$branch = "fix/ci-yaml-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git switch -c $branch | Out-Null

# 2) Funciones de parcheo seguro (texto → YAML mínimo)
function Edit-File($path, [ScriptBlock]$mut){
  if(-not (Test-Path $path)){ return $false }
  $orig = Get-Content -Raw $path -Encoding UTF8
  $mod  = & $mut $orig
  if($mod -ne $orig){
    $mod | Set-Content -NoNewline -Encoding UTF8 $path
    Write-Host "  · Modificado: $path"
    return $true
  }
  return $false
}

$changed = $false

# 3) Limpiar fences/tabuladores y asegurar DEPLOY_ENABLED en ci.yml
$ci = '.github/workflows/ci.yml'
$changed = (Edit-File $ci {
  param($t)
  $t = $t -replace '```[^\n]*',''          # quita fences markdown
  $t = $t -replace "`t",'  '               # tabs → espacios
  if($t -notmatch '^[ ]*env:\s*\r?\n'){    # no hay env root → lo insertamos arriba tras 'name:' si existe
    if($t -match '^[ ]*name:\s*.+\r?\n'){
      $t = [regex]::Replace($t, '(^[ ]*name:.*\r?\n)', { param($m) $m.Value + "env`r`n  DEPLOY_ENABLED: 'false'`r`n" }, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    } else {
      $t = "env`r`n  DEPLOY_ENABLED: 'false'`r`n$t"
    }
  } elseif($t -notmatch 'DEPLOY_ENABLED:'){
    $t = [regex]::Replace($t, '(^[ ]*env:\s*\r?\n)', { param($m) $m.Value + "  DEPLOY_ENABLED: 'false'`r`n" }, [System.Text.RegularExpressions.RegexOptions]::Multiline)
  }
  # neutraliza pnpm → npm
  $t = $t -replace '(?mi)^\s*run:\s*pnpm\s+ci','run: npm ci || npm install'
  $t = $t -replace '(?mi)^\s*run:\s*pnpm\s+install','run: npm ci || npm install'
  $t = $t -replace '(?mi)^\s*run:\s*pnpm\s+','run: npm '
  # si hay pasos docker/buildx y no quieres deploy, fuerza condición
  $t = $t -replace '(?mi)^\s*uses:\s*docker/.*','if: env.DEPLOY_ENABLED == ''true''`r`n      $0'
  return $t
}) -or $changed

# 4) Activar cockpit-ci con triggers y sin pnpm/Docker
$cockpit = '.github/workflows/cockpit-ci.yml'
$changed = (Edit-File $cockpit {
  param($t)
  $t = $t -replace '```[^\n]*',''
  $t = $t -replace "`t",'  '
  if($t -notmatch '^[ ]*name:\s*'){
    $t = "name: Cockpit CI`r`n$t"
  }
  if($t -notmatch '^[ ]*on:\s*'){
    $t = $t + @"
`r
on:
  pull_request:
    branches: [ main ]
    paths:
      - ".dev/cockpit/**"
      - "apps/web/**"
      - "types/**"
      - "tsconfig.cockpit.dev.json"
  push:
    branches: [ "feature/**", "fix/**" ]
    paths:
      - ".dev/cockpit/**"
      - "apps/web/**"
      - "types/**"
      - "tsconfig.cockpit.dev.json"
"@
  }
  if($t -notmatch '^[ ]*env:\s*'){
    $t = [regex]::Replace($t, '(^[ ]*jobs:\s*)', { param($m) "env`r`n  DEPLOY_ENABLED: 'false'`r`n" + $m.Value }, [System.Text.RegularExpressions.RegexOptions]::Multiline)
  } elseif($t -notmatch 'DEPLOY_ENABLED:'){
    $t = [regex]::Replace($t, '(^[ ]*env:\s*\r?\n)', { param($m) $m.Value + "  DEPLOY_ENABLED: 'false'`r`n" }, [System.Text.RegularExpressions.RegexOptions]::Multiline)
  }
  # neutraliza pnpm → npm
  $t = $t -replace '(?mi)^\s*run:\s*pnpm\s+ci','run: npm ci || npm install'
  $t = $t -replace '(?mi)^\s*run:\s*pnpm\s+install','run: npm ci || npm install'
  $t = $t -replace '(?mi)^\s*run:\s*pnpm\s+','run: npm '
  # blinda Docker en false
  $t = $t -replace '(?mi)^\s*uses:\s*docker/.*','if: env.DEPLOY_ENABLED == ''true''`r`n      $0'
  return $t
}) -or $changed

# 5) Mostrar diff corto y decidir commit
git status --porcelain=1 --branch
git -c color.ui=always diff -- .github/workflows/ci.yml .github/workflows/cockpit-ci.yml

if(-not $changed){
  Write-Host "`nℹ️ No hay cambios efectivos que commitear. Salgo."
  Pop-Location; return
}

git add .github/workflows/ci.yml .github/workflows/cockpit-ci.yml
if((git diff --cached --name-only).Trim().Length -eq 0){
  Write-Host "`nℹ️ Nada staged. Salgo."
  Pop-Location; return
}

git commit -m "ci: YAML limpio, DEPLOY_ENABLED=false, neutralizar pnpm/Docker y activar triggers cockpit" | Out-Null

if($Push){
  git push origin HEAD
  Write-Host "✅ Push realizado a rama: $branch"
  if($CreatePR){
    if(Get-Command gh -ErrorAction SilentlyContinue){
      try{
        gh auth status | Out-Null
        gh pr create --title "CI: arreglos YAML + cockpit-ci activado" `
          --body "Limpieza YAML; DEPLOY_ENABLED=false; pnpm→npm; Docker guard; triggers por paths." `
          --base main --head $branch --draft | Out-Null
        Write-Host "✅ PR creado (draft). Revisa la pestaña Actions."
      } catch {
        Write-Host "⚠️ gh no autenticado. Abre PR manualmente:"
        Write-Host ("https://github.com/ECONEURA/ECONEURA-/compare/main...{0}" -f $branch)
      }
    } else {
      Write-Host "ℹ️ Sin gh. Abre PR manualmente:"
      Write-Host ("https://github.com/ECONEURA/ECONEURA-/compare/main...{0}" -f $branch)
    }
  } else {
    Write-Host "ℹ️ PR no solicitado. URL para PR manual:" 
    Write-Host ("https://github.com/ECONEURA/ECONEURA-/compare/main...{0}" -f $branch)
  }
} else {
  Write-Host "ℹ️ Push NO ejecutado (omite con -Push). Para PR usa -CreatePR o abre la URL manual."
  Write-Host ("https://github.com/ECONEURA/ECONEURA-/compare/main...{0}" -f $branch)
}

Pop-Location

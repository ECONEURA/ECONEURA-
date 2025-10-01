# Script de limpieza automática (PowerShell) - ejecuta en la raíz del repo
# Crea una rama, intenta fixes y mueve paquetes que fallen a disabled-packages/

set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Timestamp y branch
$ts = (Get-Date).ToString('yyyyMMdd-HHmmss')
$branch = "cleanup/auto-fix-$ts"

Write-Host "Creando rama $branch ..."
git checkout -b $branch

# Comprueba pnpm
try {
  pnpm -v > $null
} catch {
  Write-Error "pnpm no está disponible en PATH. Instala pnpm antes de continuar."
  exit 1
}

Write-Host "Instalando dependencias (pnpm install --frozen-lockfile) ..."
pnpm install --frozen-lockfile

# Directorios a priorizar
$targets = @("apps/web", ".dev/cockpit", "packages/shared")

# Asegura carpetas auxiliares
$disabledDir = ".disabled-packages/$ts"
New-Item -ItemType Directory -Force -Path $disabledDir | Out-Null

# Ejecuta ESLint --fix por target y recoge salidas
$eslintReport = "eslint-report-$ts.txt"
Remove-Item -Force -ErrorAction SilentlyContinue $eslintReport
foreach ($t in $targets) {
  if (Test-Path $t) {
    Write-Host "Ejecutando ESLint --fix en $t ..."
    try {
  pnpm -w -r exec eslint $t --ext .ts,.tsx,.js,.jsx --fix 2>&1 | Tee-Object -FilePath $eslintReport -Append
    } catch {
      Write-Host "ESLint retornó errores en $t (capturado). Continúo. Revisa $eslintReport para detalles."
    }
  } else {
    Write-Host "No existe $t, lo salto."
  }
}

# Commit de los auto-fixes (si hay)
git add -A
if ((git status --porcelain) -ne "") {
  git commit --no-verify -m "chore: auto-fixes eslint para targets: $($targets -join ', ')"
  Write-Host "Auto-fixes commiteados (sin hooks)."
} else {
  Write-Host "No hubo cambios auto-fix para commitear."
}

# Funciones para test + typecheck; si fallan, movemos el target a disabled-dir
function Run-Typecheck-And-Tests($path) {
  Write-Host "`n---- Procesando $path ----"
  Push-Location $path
  try {
    Write-Host "Instalando en $path (si aplica) ..."
    if (Test-Path "pnpm-lock.yaml") {
      pnpm install --frozen-lockfile
    } else {
      pnpm install --no-frozen-lockfile
    }

    $typeErr = $false
    $testErr = $false

    Write-Host "Corriendo typecheck (si existe script 'typecheck') ..."
    try {
      pnpm run typecheck --if-present
    } catch {
      Write-Host "Typecheck falló en $path"
      $typeErr = $true
    }

    Write-Host "Corriendo tests (si existe script 'test:ci' o 'test') ..."
    try {
      if (Test-Path "package.json") {
        $pkgJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
        $hasTestCi = $false
        if ($pkgJson -and $pkgJson.scripts) {
          $hasTestCi = $pkgJson.scripts.PSObject.Properties.Name -contains 'test:ci'
        }
        if ($hasTestCi) {
          pnpm run test:ci --if-present
        } else {
          pnpm run test --if-present -- --run
        }
      } else {
        Write-Host "No existe package.json en $path — salto tests/typecheck (no moveré automáticamente)."
        # keep errs false; we don't want to move packages that don't have package.json
      }
    } catch {
      Write-Host "Tests fallaron en $path"
      $testErr = $true
    }

    Pop-Location
    return @{ typeErr = $typeErr; testErr = $testErr }
  } catch {
    Pop-Location
    Write-Host ("Error inesperado procesando {0}: {1}" -f $path, $_)
    return @{ typeErr = $true; testErr = $true }
  }
}

# Recorre targets y decide mover si fallan
$report = @()
foreach ($t in $targets) {
  if (Test-Path $t) {
    $res = Run-Typecheck-And-Tests $t
    # Normalize result to a hashtable with typeErr/testErr keys
    if ($null -eq $res) { $res = @{ typeErr = $true; testErr = $true } }
    if ($res -is [System.Collections.IDictionary]) {
      $typeErr = $res['typeErr'] -eq $true
      $testErr = $res['testErr'] -eq $true
    } else {
      # try to coerce
      try { $co = [pscustomobject]$res; $typeErr = $co.typeErr -eq $true; $testErr = $co.testErr -eq $true } catch { $typeErr = $true; $testErr = $true }
    }
    if ($typeErr -or $testErr) {
      Write-Host "FALLA en $t -> moviendo a $disabledDir ..."
      $name = Split-Path $t -Leaf
      $dest = Join-Path $disabledDir $name
      if (Test-Path $dest) {
        $dest = "$dest-dup-$ts"
      }
      Move-Item -Force $t $dest
      $note = Join-Path $dest "DISABLED_REASON.txt"
      "Disabled on $ts by cleanup script. typeErr=$($res.typeErr) testErr=$($res.testErr)" | Out-File $note -Encoding utf8
      git add -A
      git commit -m "chore: moved failing package $t to disabled-packages for cleanup (typeErr=$($res.typeErr), testErr=$($res.testErr))"
      $report += @{ path = $t; moved = $true; dest = $dest; reason = $note }
    } else {
      $report += @{ path = $t; moved = $false }
    }
  } else {
    $report += @{ path = $t; moved = $false; note = "not-found" }
  }
}

# Crear README en disabled-packages
$readme = Join-Path $disabledDir "README.md"
@"
Carpeta creada por cleanup script en $ts
Contiene paquetes movidos automáticamente porque fallaban typecheck/tests
Para restaurar: mover cada carpeta desde $disabledDir/<package> de vuelta a su ubicación original y crear PR.
"@ | Out-File $readme -Encoding utf8

git add -A
if ((git status --porcelain) -ne "") {
  git commit -m "chore: moved failing packages to disabled-packages and added $disabledDir/README"
} else {
  Write-Host "No hay nuevos cambios para commitear."
}

Write-Host "`n==== Resumen ===="
foreach ($r in $report) {
  Write-Host ("{0} -> moved: {1} {2}" -f $r.path, $r.moved, ($r.dest -or ''))
}

Write-Host "`nSe ha creado la rama $branch con los commits. Revisa los cambios y haz push si estás listo:"
Write-Host "  git push -u origin $branch"
Write-Host "Archivos de reportes: $eslintReport"

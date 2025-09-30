$ErrorActionPreference="Stop"; Set-StrictMode -Version Latest
function Need($n){ if(-not (Get-Command $n -ErrorAction SilentlyContinue)){ throw "❌ Falta '$n' en PATH" } }
Need node; Need npm

$ROOT = Get-Location
$PATCHDIR = Join-Path $ROOT ".econeura_patches"; New-Item -ItemType Directory -Force -Path $PATCHDIR | Out-Null
$DATE = Get-Date -Format "yyyyMMdd-HHmmss"
$GIT = (Get-Command git -ErrorAction SilentlyContinue)

# 0) Branch + snapshot seguros
if($GIT){
  try{
    git rev-parse --git-dir *> $null
    $branch = "fix/cockpit-$DATE"
    git checkout -b $branch
    git add -A; git diff > (Join-Path $PATCHDIR "pre-change-$DATE.patch")
  } catch {}
}

# 1) Limpieza cachés TS
Get-ChildItem -Recurse -Include *.tsbuildinfo -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# 2) tsconfig.cockpit.dev.json (paths controlados, no toca tsconfig.json)
$tsDev = Join-Path $ROOT "tsconfig.cockpit.dev.json"
@'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@econeura/shared": ["packages/shared/src/index.ts"],
      "@econeura/shared/*": ["packages/shared/src/*"]
    },
    "typeRoots": ["./node_modules/@types", "./types"]
  },
  "include": ["**/*.ts", "**/*.tsx", "types/**/*.d.ts"]
}
'@ | Out-File -Encoding utf8 $tsDev

# 3) Augment Axios para config.metadata
New-Item -ItemType Directory -Force -Path (Join-Path $ROOT "types") | Out-Null
@'
import "axios";
declare module "axios" {
  interface AxiosRequestConfig { metadata?: Record<string, any>; }
  interface InternalAxiosRequestConfig { metadata?: Record<string, any>; }
}
'@ | Out-File -Encoding utf8 (Join-Path $ROOT "types/axios.d.ts")

# 4) Normalización de imports (mapa controlado) + fix Zod
$srcRoots = @("packages","apps") | ForEach-Object { Join-Path $ROOT $_ } | Where-Object { Test-Path $_ }
$files = foreach($r in $srcRoots){
  Get-ChildItem $r -Recurse -File -Include *.ts,*.tsx `
    | Where-Object { $_.FullName -notmatch "\\node_modules\\|\\dist\\|\\build\\|\\coverage\\|\\artifacts\\|\\.cache\\|\\patches" }
}

$replacements = @(
  @{ from="@econeura/shared/src/logging"; to="@econeura/shared/logging" },
  @{ from="@econeura/shared/utils/logger"; to="@econeura/shared/logging" },
  @{ from="@econeura/shared/src/schemas";  to="@econeura/shared/schemas" },
  @{ from="@econeura/shared/src/metrics";  to="@econeura/shared/metrics" },
  @{ from="@econeura/shared/src/utils";    to="@econeura/shared/utils" }
)

[int]$mod=0
foreach($f in $files){
  $c = Get-Content $f -Raw
  $o = $c

  foreach($m in $replacements){
    $c = $c -replace ([Regex]::Escape($m.from) + "(\.ts|\.js)?\b"), $m.to
  }
  # quitar .ts/.js residuales en imports de @econeura/*
  $c = $c -replace "from\s+'(@econeura/[^']+)\.(ts|js)'", "from '$1'"
  # Zod: firma correcta
  $c = $c -replace "z\.record\(\s*\)", "z.record(z.string(), z.unknown())"
  $c = $c -replace "z\.record\(\s*z\.unknown\(\)\s*\)", "z.record(z.string(), z.unknown())"
  $c = $c -replace "z\.record\(\s*z\.any\(\)\s*\)", "z.record(z.string(), z.any())"

  if($c -ne $o){ Set-Content $f $c -Encoding utf8; $mod++ }
}
"🔧 Archivos modificados: $mod"
if($GIT){ git add -A; git diff --staged > (Join-Path $PATCHDIR "post-change-$DATE.patch") }

# 5) Live Preview embebido (preview.html + settings)
$webDir = Join-Path $ROOT "apps/web"
if(Test-Path $webDir){
  $prevDir = Join-Path $webDir "preview"; New-Item -ItemType Directory -Force -Path $prevDir | Out-Null
  @'
<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ECONEURA Preview</title>
<style>html,body,iframe{height:100%;width:100%;margin:0;border:0}body{background:#0b1220}</style></head>
<body><iframe src="http://127.0.0.1:8080/" allow="clipboard-read; clipboard-write"></iframe></body></html>
'@ | Out-File -Encoding utf8 (Join-Path $prevDir "preview.html")

  $vscode = Join-Path $ROOT ".vscode"; New-Item -ItemType Directory -Force -Path $vscode | Out-Null
  @"
{
  "livePreview.defaultPreviewPath": "${($prevDir -replace '\\','/')}/preview.html",
  "livePreview.openPreviewTarget": "Embedded Preview",
  "livePreview.serverKeepAliveAfterEmbeddedPreviewClose": true
}
"@ | Out-File -Encoding utf8 (Join-Path $vscode "settings.json")
}

# 6) Typecheck con tsconfig dev (paths)
$hasScript = (Test-Path (Join-Path $ROOT "package.json")) -and ((Get-Content (Join-Path $ROOT "package.json") -Raw) -match '"typecheck"\s*:')
try{
  if($hasScript){ npm run -s typecheck } else { npx --yes tsc -p $tsDev --noEmit }
} catch { throw "❌ Typecheck falló. Revisa la terminal para los errores." }
"✅ Typecheck OK"

# 7) Arranque del cockpit (Vite) y espera de puerto
if(Test-Path $webDir){
  Push-Location $webDir
  if(-not (Test-Path "node_modules")){ npm i -s }
  $env:VITE_PORT="8080"
  Start-Process -FilePath "npm" -ArgumentList "run","dev","--","--host","127.0.0.1","--port","8080" -WindowStyle Hidden
  Pop-Location

  $deadline = (Get-Date).AddMinutes(2)
  $up=$false
  while((Get-Date) -lt $deadline){
    try{
      $r = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8080"
      if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){ $up=$true; break }
    } catch {}
    Start-Sleep -Seconds 1
  }
  if($up){
    "🚀 Cockpit levantado en http://127.0.0.1:8080/"
    "🖼  Abre el panel embebido: apps/web/preview/preview.html → 'Open with Live Preview' (ya preconfigurado)."
  } else {
    "⚠️ Vite no respondió a tiempo. Abre manualmente: cd apps/web; npm run dev -- --host 127.0.0.1 --port 8080"
  }
} else {
  "ℹ️ No existe apps/web. Solo quedó listo el typecheck y configuración de paths/preview."
}
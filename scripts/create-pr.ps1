param(
    [string]$Title = 'chore(cockpit): reproducible dev startup & tests',
    [string]$Head = 'feature/cockpit-dev-setup',
    [string]$Base = 'main',
    [string]$BodyFile = '.git/PR_DRAFT_BODY.md'
)

if (-not $env:GITHUB_TOKEN) {
    Write-Error "GITHUB_TOKEN not set in environment. Export a PAT in GITHUB_TOKEN and retry."
    exit 1
}

if (-not (Test-Path $BodyFile)) {
    $default = @(
        "Agrega scaffold de cockpit, scripts de arranque, pruebas unitarias rápidas y workflow CI que aísla tests del cockpit.",
        "Include meta-script for local start and esbuild-based build."
    ) -join "`n
"
    $default | Out-File -FilePath $BodyFile -Encoding utf8
}

$bodyRaw = Get-Content -Path $BodyFile -Raw

$payload = @{ title = $Title; head = $Head; base = $Base; body = $bodyRaw; draft = $true } | ConvertTo-Json -Depth 6

$resp = Invoke-RestMethod -Uri "https://api.github.com/repos/ECONEURA/ECONEURA-/pulls" -Method POST -Headers @{ Authorization = "token $env:GITHUB_TOKEN"; "User-Agent" = "ec" } -Body $payload -ContentType "application/json"

Write-Output "PR created: $($resp.html_url)"

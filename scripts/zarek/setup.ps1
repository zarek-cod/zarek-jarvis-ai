[CmdletBinding()]
param(
    [switch]$SkipModels
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$env:Path = "${env:USERPROFILE}\.cargo\bin;${env:LOCALAPPDATA}\Programs\Ollama;${env:LOCALAPPDATA}\Microsoft\WinGet\Links;$env:Path"
$configRoot = Join-Path $env:USERPROFILE '.openjarvis'
$configTarget = Join-Path $configRoot 'config.toml'
$promptTarget = Join-Path $configRoot 'ZAREK-SYSTEM.md'
$templatePath = Join-Path $repoRoot 'configs\zarek\config.toml'
$promptSource = Join-Path $repoRoot 'configs\zarek\ZAREK-SYSTEM.md'

New-Item -ItemType Directory -Path $configRoot -Force | Out-Null
Copy-Item -LiteralPath $promptSource -Destination $promptTarget -Force

$promptForToml = $promptTarget.Replace('\', '/')
$repoForToml = $repoRoot.Replace('\', '/')
$configText = (Get-Content -LiteralPath $templatePath -Raw).Replace(
    '__ZAREK_SYSTEM_PROMPT__',
    $promptForToml
).Replace('__ZAREK_ALLOWED_DIR__', $repoForToml)
[System.IO.File]::WriteAllText($configTarget, $configText, [System.Text.UTF8Encoding]::new($false))

if (-not $SkipModels) {
    & ollama pull qwen3.5:4b
    if ($LASTEXITCODE -ne 0) { throw "No se pudo descargar qwen3.5:4b" }
    & ollama pull qwen3.5:2b
    if ($LASTEXITCODE -ne 0) { throw "No se pudo descargar qwen3.5:2b" }
}

Write-Host "ZAREK configurado en $configTarget" -ForegroundColor Cyan
Write-Host 'Proveedor TTS: Kokoro local / voz española em_alex' -ForegroundColor Cyan
Write-Host 'ElevenLabs permanece opcional y sin credenciales configuradas.' -ForegroundColor DarkCyan

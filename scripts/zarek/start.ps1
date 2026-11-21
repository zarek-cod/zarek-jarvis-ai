[CmdletBinding()]
param(
    [switch]$Web
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$env:Path = "${env:USERPROFILE}\.cargo\bin;${env:LOCALAPPDATA}\Programs\Ollama;${env:LOCALAPPDATA}\Microsoft\WinGet\Links;$env:Path"

Push-Location $repoRoot
try {
    if ($Web) {
        & uv run jarvis gui
        if ($LASTEXITCODE -ne 0) { throw "ZAREK web terminó con el código $LASTEXITCODE" }
    } else {
        Push-Location (Join-Path $repoRoot 'frontend')
        try {
            $env:CARGO_BUILD_JOBS = '1'
            & npm run tauri dev
            if ($LASTEXITCODE -ne 0) { throw "ZAREK Desktop terminó con el código $LASTEXITCODE" }
        } finally { Pop-Location }
    }
} finally {
    Pop-Location
}

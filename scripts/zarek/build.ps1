$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$env:Path = "${env:USERPROFILE}\.cargo\bin;${env:LOCALAPPDATA}\Programs\Ollama;${env:LOCALAPPDATA}\Microsoft\WinGet\Links;$env:Path"
$env:CARGO_BUILD_JOBS = '1'

Push-Location (Join-Path $repoRoot 'frontend')
try {
    & npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
    & npm run tauri build -- --bundles nsis
    if ($LASTEXITCODE -ne 0) { throw "Tauri build failed with exit code $LASTEXITCODE" }
} finally { Pop-Location }

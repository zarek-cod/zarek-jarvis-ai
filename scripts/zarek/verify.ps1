$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$env:Path = "${env:USERPROFILE}\.cargo\bin;${env:LOCALAPPDATA}\Programs\Ollama;${env:LOCALAPPDATA}\Microsoft\WinGet\Links;$env:Path"
$env:CARGO_BUILD_JOBS = '1'

function Invoke-Checked {
    param(
        [Parameter(Mandatory)] [scriptblock]$Command,
        [Parameter(Mandatory)] [string]$Name
    )
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name falló con el código $LASTEXITCODE"
    }
}

Push-Location $repoRoot
try {
    Write-Host '=== Herramientas ===' -ForegroundColor Cyan
    Invoke-Checked { uv --version } 'uv'
    Invoke-Checked { rustc --version } 'rustc'
    Invoke-Checked { node --version } 'node'
    Invoke-Checked { npm --version } 'npm'
    Invoke-Checked { ollama --version } 'ollama'

    Write-Host '=== Modelos locales ===' -ForegroundColor Cyan
    Invoke-Checked { ollama list } 'ollama list'

    Write-Host '=== Diagnóstico local ===' -ForegroundColor Cyan
    Invoke-Checked { uv run jarvis doctor } 'jarvis doctor'

    Write-Host '=== Backend ZAREK ===' -ForegroundColor Cyan
    Invoke-Checked {
        uv run pytest tests\core\test_config.py tests\speech tests\server\test_speech_routes.py -q
    } 'pytest'

    Write-Host '=== Frontend ===' -ForegroundColor Cyan
    Push-Location (Join-Path $repoRoot 'frontend')
    try {
        Invoke-Checked { npm test -- --run } 'Vitest'
        Invoke-Checked { npm run build } 'Vite build'
    } finally { Pop-Location }

    Write-Host '=== Rust/Tauri ===' -ForegroundColor Cyan
    Push-Location (Join-Path $repoRoot 'frontend\src-tauri')
    try {
        Invoke-Checked { cargo test --lib } 'Cargo tests'
    } finally { Pop-Location }

    Write-Host 'Validación ZAREK completada.' -ForegroundColor Green
} finally { Pop-Location }

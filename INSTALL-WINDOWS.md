# Instalación en Windows 11

## Requisitos verificados para este equipo

- Windows 11 x64.
- Python 3.12 (no usar Python 3.14 para este proyecto).
- Node.js 22.22 o superior y npm 11.19–11.x.
- Git, `uv`, Rust estable, Visual Studio C++ workload y WebView2.
- Ollama.

## Instalar dependencias del proyecto

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:LOCALAPPDATA\Programs\Ollama;$env:LOCALAPPDATA\Microsoft\WinGet\Links;$env:Path"
uv sync --python 3.12 --extra desktop --extra voice --extra gpu-metrics --extra dev --group desktop-native
Set-Location frontend
npm ci
Set-Location ..
```

## Configurar ZAREK

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\setup.ps1
```

El script instala la configuración bajo `%USERPROFILE%\.openjarvis`, descarga los modelos gratuitos configurados y no registra servicios permanentes.

## Ejecutar

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\start.ps1
```

## Compilar instalador

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\build.ps1
```

Los artefactos de Tauri se generan bajo `frontend\src-tauri\target\release\bundle`.

El instalador comunitario `v1.0.1-zarek` no está firmado con Authenticode. Antes de ejecutarlo, compare su SHA-256 con el valor publicado en la release y en `VALIDATION.md`.

## Actualizar desde OpenJarvis

La rama `main` y el remoto `upstream` se conservan. Actualice sin sobrescribir ZAREK:

```powershell
git fetch upstream
git switch zarek/development
git merge --no-ff upstream/main
```

Revise conflictos, ejecute `scripts\zarek\verify.ps1` y vuelva a compilar. El updater de OpenJarvis está desactivado en la variante ZAREK para impedir que un paquete upstream sustituya personalizaciones.

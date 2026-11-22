# Instalación en Windows 11

## Abrir la aplicación instalada

El instalador 1.1.0 crea accesos directos en el Escritorio y en el menú Inicio (`ZAREK SYSTEMS`). El ejecutable verificado queda exactamente en:

```text
C:\Users\joels\AppData\Local\ZAREK JARVIS AI\zarek-jarvis-desktop.exe
```

Puede abrirse desde PowerShell sin VS Code:

```powershell
Start-Process "$env:LOCALAPPDATA\ZAREK JARVIS AI\zarek-jarvis-desktop.exe"
```

La primera apertura prepara el backend local y puede tardar. Las siguientes reutilizan el entorno. La aplicación conserva la bandeja del sistema y no abre una consola negra.

## Seleccionar y probar el micrófono

1. Abra **Configuración > Matriz de audio / entrada local**.
2. Pulse **Dar acceso** cuando Windows lo solicite.
3. Elija cualquier entrada del selector; la elección queda guardada localmente.
4. Pulse **Probar micrófono** y compruebe la barra de nivel en tiempo real.
5. Ajuste sensibilidad, ganancia si el controlador la expone, supresión de ruido, cancelación de eco, ganancia automática y corte por silencio.
6. **Detectar cambios** vuelve a enumerar los dispositivos; también se actualizan al conectar o retirar uno.

Para hablar, use el botón del micrófono o `Ctrl + Shift + Espacio`. Para “Jarvis”, active **Entrada por voz**, **Palabra de activación** y, solo si acepta la escucha local continua, **Acepto y activar**. Puede decir “Jarvis, abre…” en una frase o “Jarvis” y dictar la orden después del tono. La escucha continua viene desactivada por defecto y puede retirarse al instante.

## Chat y Modo Voz

- **Conversación** mantiene el chat completo y permite escribir o dictar.
- **Modo Voz** abre un panel inmersivo con el núcleo grande y sin campo de mensaje. Pulse el micrófono y hable, use `Ctrl + Shift + Espacio` o diga “Jarvis” si aceptó la escucha continua.
- Al terminar de generar, Kokoro lee automáticamente la respuesta. Mientras habla aparecen **JARVIS está hablando** y el botón **Detener**.
- Para interrumpir y volver a hablar, pulse el micrófono grande o `Ctrl + Shift + Espacio`; ambos detienen primero la voz de JARVIS.

El instalador 1.1.0 elimina el caché de service worker dejado por versiones antiguas de la interfaz. No borra conversaciones, dispositivos elegidos ni preferencias.

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

El instalador comunitario `v1.1.0` no está firmado con Authenticode. Antes de ejecutarlo, compare su SHA-256 con el valor publicado en la release y en `VALIDATION.md`.

## Actualizar desde OpenJarvis

La rama `main` y el remoto `upstream` se conservan. Actualice sin sobrescribir ZAREK:

```powershell
git fetch upstream
git switch zarek/development
git merge --no-ff upstream/main
```

Revise conflictos, ejecute `scripts\zarek\verify.ps1` y vuelva a compilar. El updater de OpenJarvis está desactivado en la variante ZAREK para impedir que un paquete upstream sustituya personalizaciones.

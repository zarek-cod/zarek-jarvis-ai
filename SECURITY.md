# Seguridad, permisos y privacidad

- La API escucha únicamente en `127.0.0.1` por defecto.
- La telemetría de rendimiento se guarda localmente; analytics externo está desactivado en la configuración ZAREK.
- Las claves de proveedores de inferencia del escritorio usan Windows Credential Manager mediante el backend `keyring` de Tauri.
- No se incluyen claves en el repositorio, scripts, configuración ni instalador.
- El prompt del sistema prohíbe aceptar instrucciones administrativas procedentes de páginas o documentos.
- Las herramientas peligrosas requieren confirmación y los escáneres de secretos/PII/inyección permanecen activos.
- `allowed_dirs` limita por defecto las herramientas de archivo a la carpeta donde cada usuario clonó ZAREK; `setup.ps1` resuelve esa ruta dinámicamente.
- El servidor se niega a escuchar en `0.0.0.0` sin una clave local.
- No se desactiva Windows Defender, firewall, Smart App Control ni UAC.
- El instalador comunitario se publica sin firma Authenticode porque no se dispone de certificado comercial. La release incluye SHA-256 y fue escaneada con Windows Defender sin amenazas.

## Brecha conocida heredada

El almacén Python de credenciales de herramientas usa un TOML local con permisos POSIX `0600`. Esa comprobación no describe ACL de Windows y una prueba upstream falla por ese motivo. Para secretos nuevos del escritorio se debe preferir Windows Credential Manager; no se debe interpretar `st_mode=0666` en NTFS como una validación de seguridad.

## Acciones que requieren aprobación

Eliminación, sobrescritura, cambios de seguridad, instalación no verificada, transmisión de información privada, publicación, compras y operaciones financieras.

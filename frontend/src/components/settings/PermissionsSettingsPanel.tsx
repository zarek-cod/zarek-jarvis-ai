import { useEffect, useState } from 'react';
import { FolderCheck, FolderPlus, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react';
import { isTauri } from '../../lib/api';

export function PermissionsSettingsPanel() {
  const [folders, setFolders] = useState<string[]>([]);
  const [status, setStatus] = useState('Cargando política local…');

  const load = async () => {
    if (!isTauri()) {
      setStatus('Disponible en la aplicación de escritorio');
      return;
    }
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      setFolders(await invoke<string[]>('get_authorized_dirs'));
      setStatus('Política activa · los cambios se aplican al reiniciar JARVIS');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (next: string[]) => {
    const { invoke } = await import('@tauri-apps/api/core');
    const saved = await invoke<string[]>('set_authorized_dirs', { dirs: next });
    setFolders(saved);
    setStatus('Guardado · reinicia JARVIS para aplicar la nueva política');
  };

  const addFolder = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false, title: 'Autorizar carpeta para JARVIS' });
      if (typeof selected === 'string' && !folders.includes(selected)) await save([...folders, selected]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <section className="zarek-permissions" aria-labelledby="zarek-permissions-title">
      <header>
        <div className="zarek-permissions__icon"><FolderCheck size={21} /></div>
        <div><div className="hud-kicker">POLÍTICA OPERACIONAL LOCAL</div><h3 id="zarek-permissions-title">Carpetas autorizadas</h3></div>
        <button type="button" className="zarek-action-button is-primary" onClick={() => void addFolder()} disabled={!isTauri()}><FolderPlus size={15} /> Añadir carpeta</button>
      </header>
      <p>JARVIS puede buscar, crear y editar dentro de estas carpetas. Borrar, sobrescribir contenido importante, cambiar seguridad o publicar información siempre requiere confirmación.</p>
      <div className="zarek-permissions__list">
        {folders.length === 0 && <div className="zarek-permissions__empty"><ShieldAlert size={17} /> No hay carpetas autorizadas.</div>}
        {folders.map((folder) => (
          <div className="zarek-permissions__row" key={folder}><code>{folder}</code><button type="button" title="Quitar autorización" onClick={() => void save(folders.filter((item) => item !== folder))}><Trash2 size={15} /></button></div>
        ))}
      </div>
      <div className="zarek-permissions__status"><RotateCcw size={13} /> {status}</div>
    </section>
  );
}

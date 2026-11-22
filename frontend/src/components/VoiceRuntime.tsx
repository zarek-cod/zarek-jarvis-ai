import { useEffect } from 'react';
import { Mic, Radio, TriangleAlert } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { isTauri } from '../lib/api';
import { useAppStore } from '../lib/store';
import { useWakeWord } from '../hooks/useWakeWord';

export function VoiceRuntime() {
  const navigate = useNavigate();
  const location = useLocation();
  const setPendingVoiceCommand = useAppStore((state) => state.setPendingVoiceCommand);
  const { status, message, enabled } = useWakeWord((command) => {
    setPendingVoiceCommand(command);
    if (location.pathname !== '/voice') navigate('/');
  });

  useEffect(() => {
    if (!isTauri()) return;
    let dispose: (() => void) | undefined;
    void import('@tauri-apps/api/event').then(async ({ listen }) => {
      dispose = await listen('zarek://toggle-microphone', () => {
        if (location.pathname !== '/voice') navigate('/');
        window.setTimeout(() => window.dispatchEvent(new Event('zarek:toggle-microphone')), 180);
      });
    });
    return () => dispose?.();
  }, [location.pathname, navigate]);

  if (!enabled && status !== 'error') return null;
  return (
    <div className={`voice-runtime is-${status}`} role="status" aria-live="polite">
      <span className="voice-runtime__icon">
        {status === 'error' ? <TriangleAlert size={15} /> : status === 'ready' ? <Radio size={15} /> : <Mic size={15} />}
      </span>
      <span>{message}</span>
      <i aria-hidden="true" />
    </div>
  );
}

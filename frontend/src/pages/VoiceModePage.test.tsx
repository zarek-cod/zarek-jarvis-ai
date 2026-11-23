import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('VoiceModePage cockpit', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('exposes the shared voice catalog directly in the voice-only experience', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
    const { VoiceModePage } = await import('./VoiceModePage');
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <VoiceModePage />
      </MemoryRouter>,
    );

    expect(html).toContain('Modo Voz');
    expect(html).toContain('Elige la voz de JARVIS');
    expect(html).toContain('Voces originales Kokoro');
    expect(html).toContain('Mezclas de timbre');
    expect(html).toContain('Combinaciones, no modelos independientes');
    expect(html).toContain('Selector de voces de JARVIS');
    expect(html).not.toContain('<textarea');
  });
});

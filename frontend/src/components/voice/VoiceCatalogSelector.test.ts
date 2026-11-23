import { describe, expect, it } from 'vitest';
import type { VoiceProfile } from '../../lib/api';
import { groupVoiceProfiles, isBlend } from './VoiceCatalogSelector';

const profile = (
  id: string,
  voiceId: string,
  kind: VoiceProfile['kind'],
): VoiceProfile => ({
  id,
  name: id,
  voice_id: voiceId,
  backend: 'kokoro',
  kind,
  source_voices: voiceId.split(','),
  gender: 'Mixta',
  language: 'Español',
  accent: 'Internacional',
  style: 'Perfil de prueba',
  preview_text: 'Sistema preparado.',
  available: true,
  delivery: 'Local',
  license: 'Apache-2.0',
  license_url: 'https://example.test',
  pitch_supported: false,
  speed_supported: true,
  volume_supported: true,
});

describe('voice catalog grouping', () => {
  it('keeps original Kokoro voices separate from embedding blends', () => {
    const atlas = profile('Atlas', 'em_alex', 'original');
    const nova = profile('Nova', 'ef_dora,em_alex', 'blend');
    const groups = groupVoiceProfiles([atlas, nova]);

    expect(isBlend(atlas)).toBe(false);
    expect(isBlend(nova)).toBe(true);
    expect(groups[0].voices.map((voice) => voice.name)).toEqual(['Atlas']);
    expect(groups[1].voices.map((voice) => voice.name)).toEqual(['Nova']);
    expect(groups[1].caption).toContain('no modelos independientes');
  });

  it('recognizes a blend by its Kokoro id for older cached catalogs', () => {
    expect(isBlend(profile('Lyra', 'ef_dora,em_santa', 'original'))).toBe(true);
  });
});

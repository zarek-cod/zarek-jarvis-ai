import { describe, expect, it } from 'vitest';
import { resolveResponseBudget } from './response-budget';

describe('response budget', () => {
  it('keeps direct questions fast and allows detailed technical work to finish', () => {
    expect(resolveResponseBudget('¿Qué hora es?', 8192)).toBe(768);
    expect(resolveResponseBudget('Explícame en detalle cómo diseñar una REST API completa', 8192)).toBe(8192);
    expect(resolveResponseBudget('Corrige este código TypeScript', 4096)).toBe(4096);
  });

  it('never exceeds the configured safety ceiling', () => {
    expect(resolveResponseBudget('Haz una investigación completa', 2048)).toBe(2048);
  });
});

/** Choose a response budget from intent instead of truncating every answer equally. */
export function resolveResponseBudget(prompt: string, configuredMaximum: number): number {
  const text = prompt.toLocaleLowerCase('es');
  const cap = Math.max(512, configuredMaximum);
  const detailed = /(detall|complet|profund|investig|analiz|explica|document|arquitect|tutorial|paso a paso|rest api|informe)/i.test(text);
  const technical = /(c[oó]digo|python|typescript|javascript|rust|sql|\bapi\b|backend|frontend|error|depura|implement|programa)/i.test(text);
  const simple = text.length < 90 && !detailed && !technical && (text.split(/\s+/).length < 14);
  if (simple) return Math.min(cap, 768);
  if (detailed) return Math.min(cap, 8192);
  if (technical || text.length > 600) return Math.min(cap, 4096);
  return Math.min(cap, 2048);
}

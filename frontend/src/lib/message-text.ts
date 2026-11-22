/** Text helpers shared between the message renderer and voice output. */

/** Remove <think> reasoning blocks so they are neither shown nor spoken. */
export function stripThinkTags(text: string): string {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>\s*/gi, '');
  cleaned = cleaned.replace(/^[\s\S]*?<\/think>\s*/i, '');
  return cleaned.trim();
}

/**
 * Turn a (usually markdown) answer into text that sounds right when read aloud: no emphasis
 * markers, heading hashes, list bullets, link syntax, bare URLs or emoji, code blocks replaced
 * by a short note, and a pause after lines that lack final punctuation.
 */
export function toSpeakableText(text: string): string {
  let t = stripThinkTags(text);
  t = t.replace(/```[\s\S]*?(?:```|$)/g, ' (code block omitted). ');
  t = t.replace(/`([^`]*)`/g, '$1');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  t = t.replace(/https?:\/\/\S+/g, '');
  t = t.replace(/^\s{0,3}#{1,6}\s*/gm, '');
  t = t.replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, '');
  t = t.replace(/\*{1,3}|~~/g, '');
  t = t.replace(/(?<![\p{L}\p{N}])_+|_+(?![\p{L}\p{N}])/gu, '');
  t = t.replace(/[\p{Extended_Pictographic}️‍]/gu, '');
  const lines = t
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  // Only separate multiple lines; a single line is spoken as written.
  const sentences =
    lines.length > 1 ? lines.map((l) => (/[.!?:;]$/.test(l) ? l : `${l}.`)) : lines;
  return sentences.join(' ').replace(/\s{2,}/g, ' ').trim();
}

/** Split speech on natural pauses so playback can begin while later audio is synthesized. */
export function splitSpeakableText(text: string, targetLength = 280): string[] {
  const speakable = toSpeakableText(text);
  if (!speakable) return [];
  const sentences = speakable.match(/[^.!?;:]+(?:[.!?;:]+|$)/g) ?? [speakable];
  const chunks: string[] = [];
  let current = '';
  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };
  for (const sentence of sentences) {
    const clean = sentence.trim();
    if (!clean) continue;
    if (current && current.length + clean.length + 1 > targetLength) flush();
    if (clean.length <= targetLength) {
      current = current ? `${current} ${clean}` : clean;
      continue;
    }
    flush();
    const words = clean.split(/\s+/);
    for (const word of words) {
      if (current && current.length + word.length + 1 > targetLength) flush();
      current = current ? `${current} ${word}` : word;
    }
  }
  flush();
  return chunks;
}

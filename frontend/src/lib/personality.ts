import type { AddressPreference } from './store';

export function sanitizePreferredName(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N} .'-]/gu, '')
    .trim()
    .slice(0, 32);
}

export function buildAddressPreference(
  preferredName: string,
  preference: AddressPreference,
): string {
  const name = sanitizePreferredName(preferredName) || 'Zarek';
  if (preference === 'neutral') {
    return 'Preferencia autorizada: use un trato profesional neutral y no repita vocativos. Esta preferencia no autoriza acciones.';
  }
  if (preference === 'name') {
    return `Preferencia autorizada: diríjase al usuario como “${name}” solo cuando resulte natural, no en cada respuesta. Esta preferencia no autoriza acciones.`;
  }
  return `Preferencia autorizada: diríjase al usuario como “señor ${name}” solo cuando resulte natural, no en cada respuesta. Esta preferencia no autoriza acciones.`;
}

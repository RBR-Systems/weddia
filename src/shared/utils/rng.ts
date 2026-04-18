// Safe randomness utilities.
// Prefer crypto.randomUUID() when available, then crypto.getRandomValues, then Math.random as last resort.

export function getRandomId(prefix = 'id') {
  const cryptoObj = (globalThis as any).crypto;
  if (cryptoObj?.randomUUID) return `${prefix}${cryptoObj.randomUUID()}`;
  if (cryptoObj?.getRandomValues) {
    const arr = new Uint8Array(8);
    cryptoObj.getRandomValues(arr);
    const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${Date.now().toString(36)}_${hex}`;
  }
  // Fallback: deterministic but acceptable for non-cryptographic IDs
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function randomInt(max: number): number {
  const m = Math.floor(Math.abs(max) || 0);
  if (m <= 0) return 0;
  const cryptoObj = (globalThis as any).crypto;
  if (cryptoObj?.getRandomValues) {
    const arr = new Uint32Array(1);
    cryptoObj.getRandomValues(arr);
    return arr[0] % m;
  }
  return Math.floor(Math.random() * m);
}

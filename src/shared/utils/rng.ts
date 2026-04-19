// Safe randomness utilities.
// Prefer crypto.randomUUID() when available; otherwise construct an RFC4122 v4 UUID with crypto.getRandomValues.
// Fallback implementations avoid Math.random (per request) and use counters/seeds derived from time.
// These fallbacks are deterministic and NOT cryptographically secure  avoid for security-sensitive uses.

let _fallbackCounter = 0;
let _fallbackSeed = (Date.now() & 0xffffffff) >>> 0 || 1;

function _nextFallbackRandom32(): number {
  // xorshift32 RNG (not cryptographically secure). Seeds with time and an incrementing counter.
  _fallbackSeed ^= (_fallbackSeed << 13) >>> 0;
  _fallbackSeed ^= (_fallbackSeed >>> 17) >>> 0;
  _fallbackSeed ^= (_fallbackSeed << 5) >>> 0;
  _fallbackSeed = (_fallbackSeed >>> 0) || 1;
  return _fallbackSeed >>> 0;
}

export function getRandomId(prefix = 'id-') {
  const cryptoObj = (globalThis as any).crypto;
  if (cryptoObj?.randomUUID) {
    try {
      return `${prefix}${cryptoObj.randomUUID()}`;
    } catch {
      // fall through to getRandomValues path
    }
  }

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    // Per RFC4122 v4: set version and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    const uuid = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    return `${prefix}${uuid}`;
  }

  // No Web Crypto: deterministic-but-unique id using timestamp + counter; avoids Math.random.
  _fallbackCounter += 1;
  return `${prefix}${Date.now().toString(36)}-${_fallbackCounter.toString(36)}`;
}

export function randomInt(max: number): number {
  const m = Math.floor(Math.abs(max) || 0);
  if (m <= 0) return 0;
  const cryptoObj = (globalThis as any).crypto;
  if (cryptoObj?.getRandomValues) {
    // Use rejection sampling to avoid modulo bias.
    const arr = new Uint32Array(1);
    const maxUint32 = 0x100000000; // 2^32
    const limit = Math.floor(maxUint32 / m) * m;
    while (true) {
      cryptoObj.getRandomValues(arr);
      const r = arr[0] >>> 0;
      if (r < limit) return r % m;
    }
  }
  // Fallback: deterministic xorshift-based PRNG seeded from time (avoids Math.random).
  return _nextFallbackRandom32() % m;
}

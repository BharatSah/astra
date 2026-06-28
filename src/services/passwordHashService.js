// Service: local-mode login password hashing.
// Uses WebCrypto SHA-256 with a per-record random salt. This is intentionally
// lightweight (PBKDF2 is overkill for an offline single-user sandbox); for the
// connected Supabase mode, Supabase Auth remains the source of truth for
// password verification and this module is not used.

const subtle = globalThis.crypto?.subtle;
const ENC = new TextEncoder();

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(text) {
  const buf = await subtle.digest('SHA-256', ENC.encode(text));
  return bytesToHex(new Uint8Array(buf));
}

function randomSaltHex(bytes = 16) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

// Returns "salt:hash" for storage. Never store the plaintext.
export async function hashPassword(plaintext) {
  if (!subtle) throw new Error('WebCrypto is not available in this context');
  const salt = randomSaltHex(16);
  const hash = await sha256Hex(`${salt}:${plaintext}`);
  return `${salt}:${hash}`;
}

// Verify plaintext against a stored "salt:hash" string.
export async function verifyPassword(plaintext, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const test = await sha256Hex(`${salt}:${plaintext}`);
  return test === hash;
}

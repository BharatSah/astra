/**
 * Client-side AES-GCM encryption helpers for vault credentials.
 *
 * Scope and limitations (read before relying on this):
 * The encryption key is derived in the browser from a passphrase the user enters
 * at vault unlock time. This protects credentials at rest in localStorage when the
 * app is running in fallback/sandbox mode, and avoids storing plaintext passwords
 * in the database. It is NOT a substitute for server-side access control (RLS/Auth):
 * if the app is connected to Supabase, rely on Supabase RLS policies as the primary
 * control and treat this as defense-in-depth.
 *
 * Key derivation: PBKDF2 (SHA-256, 250k iterations) -> AES-GCM 256-bit.
 */

const SUBTLE = globalThis.crypto?.subtle;
const ENC = new TextEncoder();
const DEC = new TextDecoder();

const PBKDF2_ITERATIONS = 250000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function bytesToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase, salt) {
  const baseKey = await SUBTLE.importKey(
    'raw',
    ENC.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return SUBTLE.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext using AES-GCM with a passphrase-derived key.
 * Returns a self-contained string: base64(salt || iv || ciphertext).
 */
export async function encryptSecret(plaintext, passphrase) {
  if (!SUBTLE) throw new Error('WebCrypto is not available in this context');
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await SUBTLE.encrypt(
    { name: 'AES-GCM', iv },
    key,
    ENC.encode(plaintext)
  );
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return `enc:v1:${bytesToBase64(combined)}`;
}

/**
 * Decrypts a value produced by encryptSecret. Returns the original plaintext.
 */
export async function decryptSecret(payload, passphrase) {
  if (!SUBTLE) throw new Error('WebCrypto is not available in this context');
  if (!payload || typeof payload !== 'string') return '';
  // Backward-compat: values not produced by encryptSecret are returned as-is
  // so existing plaintext rows still render until re-saved.
  if (!payload.startsWith('enc:v1:')) return payload;
  const combined = base64ToBytes(payload.slice(7));
  const salt = combined.slice(0, SALT_BYTES);
  const iv = combined.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const ciphertext = combined.slice(SALT_BYTES + IV_BYTES);
  const key = await deriveKey(passphrase, salt);
  const plaintext = await SUBTLE.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return DEC.decode(plaintext);
}

export function isEncrypted(payload) {
  return typeof payload === 'string' && payload.startsWith('enc:v1:');
}
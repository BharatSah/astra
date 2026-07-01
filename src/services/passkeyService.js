/**
 * Passkey (WebAuthn) authentication helpers.
 *
 * This module replaces typed passwords for the app login and the password vault.
 * It offers two flows:
 *
 * 1. PRF extension (preferred): when the authenticator supports the PRF extension,
 *    a deterministic symmetric key is derived directly from the credential during
 *    authentication. This key is used to wrap/unwrap a randomly generated vault
 *    passphrase.
 *
 * 2. Signature fallback: for authenticators without PRF, we challenge the same
 *    credential with a fixed salt and hash the resulting assertion signature with
 *    SHA-256 to produce a deterministic key.
 *
 * The wrapped vault passphrase is stored in Supabase auth user_metadata.
 * The vault encryption key (AES-GCM key derived from the passphrase) never leaves
 * the browser, and the passphrase is only held in memory while the vault is unlocked.
 */

import {
  loadStoredCredential,
  saveStoredCredential,
  loadWrappedVaultKey,
  saveWrappedVaultKey,
  savePrfEnabled,
  clearStoredPasskey
} from '../models/passkeysModel.js';

const ENC = new TextEncoder();

const RP_NAME = 'Astra';
const PRF_INPUT = new Uint8Array(32).fill(0x01);
const FALLBACK_CHALLENGE = new Uint8Array(32).fill(0x02);

export class PasskeyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PasskeyError';
  }
}

function isWebAuthnAvailable() {
  return typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
}

async function ensureAvailable() {
  if (!isWebAuthnAvailable()) {
    throw new PasskeyError('Passkeys are not supported in this browser.');
  }
  const platformUvpa = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
  const crossPlatform = await PublicKeyCredential.isCrossPlatformAuthenticatorAvailable?.();
  if (!platformUvpa && !crossPlatform) {
    throw new PasskeyError('No user-verifying authenticator is available on this device.');
  }
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function concatenateBuffers(...parts) {
  const total = parts.reduce((sum, p) => sum + p.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }
  return out.buffer;
}

function getRpId() {
  return window.location.hostname;
}

export function userHandle() {
  return ENC.encode('astra-user');
}

export function generateVaultPassphrase() {
  return bufferToBase64(crypto.getRandomValues(new Uint8Array(32)));
}

export async function registerPasskey(userId = null) {
  await ensureAvailable();

  const publicKey = {
    rp: { name: RP_NAME, id: getRpId() },
    user: {
      name: userId || 'astra-user',
      displayName: 'Astra User',
      id: userHandle(),
    },
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    authenticatorSelection: {
      userVerification: 'required',
      residentKey: 'preferred',
      authenticatorAttachment: 'platform',
    },
    attestation: 'none',
    extensions: { prf: { eval: { first: PRF_INPUT } } },
  };

  let credential;
  try {
    credential = await navigator.credentials.create({ publicKey });
  } catch (err) {
    throw new PasskeyError(`Passkey registration failed: ${err.message}`);
  }

  if (!credential) {
    throw new PasskeyError('Passkey registration was cancelled or not supported.');
  }

  const id = bufferToBase64(credential.rawId);
  await saveStoredCredential(id);

  const extensionResults = credential.getClientExtensionResults?.() || {};
  const prfResult = extensionResults.prf;
  if (prfResult?.enabled) {
    await savePrfEnabled(true);
  }

  return { credentialId: id, prfEnabled: Boolean(prfResult?.enabled) };
}

export async function authenticatePasskey() {
  await ensureAvailable();

  const storedId = await loadStoredCredential();
  if (!storedId) {
    throw new PasskeyError('No passkey is registered for this app.');
  }

  const credentialId = base64ToBuffer(storedId);
  const publicKey = {
    challenge: FALLBACK_CHALLENGE,
    allowCredentials: [{ id: credentialId, type: 'public-key' }],
    userVerification: 'required',
    rpId: getRpId(),
    extensions: { prf: { eval: { first: PRF_INPUT } } },
  };

  let assertion;
  try {
    assertion = await navigator.credentials.get({ publicKey });
  } catch (err) {
    throw new PasskeyError(`Passkey authentication failed: ${err.message}`);
  }

  if (!assertion) {
    throw new PasskeyError('Passkey authentication was cancelled.');
  }

  const extensionResults = assertion.getClientExtensionResults?.() || {};
  const prf = extensionResults.prf;

  if (prf?.results?.first) {
    const raw = prf.results.first;
    return crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  const signature = assertion.response.signature;
  if (!signature) {
    throw new PasskeyError('Passkey did not return a usable authentication result.');
  }

  const rpIdBytes = ENC.encode(getRpId());
  const combined = concatenateBuffers(rpIdBytes, assertion.rawId, signature);
  const digest = await crypto.subtle.digest('SHA-256', combined);
  return crypto.subtle.importKey(
    'raw',
    digest,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function hasRegisteredPasskey() {
  return Boolean(await loadStoredCredential());
}

export async function clearRegisteredPasskey() {
  await clearStoredPasskey();
}


export async function wrapVaultPassphrase(passphrase, passkeyKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    passkeyKey,
    ENC.encode(passphrase)
  );
  const combined = concatenateBuffers(iv, ciphertext);
  await saveWrappedVaultKey(bufferToBase64(combined));
}

export async function unwrapVaultPassphrase(passkeyKey) {
  const stored = await loadWrappedVaultKey();
  if (!stored) return null;
  const combined = new Uint8Array(base64ToBuffer(stored));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      passkeyKey,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  } catch (error) {
    void error;
    throw new PasskeyError('Could not decrypt vault with this passkey.');
  }
}

export async function hasWrappedVaultKey() {
  return Boolean(await loadWrappedVaultKey());
}

// Model: persisting WebAuthn credential IDs and wrapped vault keys.
// Two backends: localStorage for sandbox/fallback mode and Supabase
// auth user_metadata for cloud mode.

import { isFallbackMode, supabase } from './dbClient.js';

const CREDENTIAL_KEY = 'astra_passkey_credential_id';
const WRAPPED_KEY = 'astra_wrapped_vault_key';
const PRF_ENABLED_KEY = 'astra_passkey_prf_enabled';

function localGet(key) {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key) || null;
}

function localSet(key, value) {
  if (typeof window === 'undefined') return;
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

export async function loadStoredCredential() {
  if (isFallbackMode) {
    return localGet(CREDENTIAL_KEY);
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.astra_passkey_credential_id || null;
}

export async function saveStoredCredential(credentialId) {
  if (isFallbackMode) {
    localSet(CREDENTIAL_KEY, credentialId);
    return;
  }
  await supabase.auth.updateUser({
    data: { astra_passkey_credential_id: credentialId }
  });
}

export async function loadWrappedVaultKey() {
  if (isFallbackMode) {
    return localGet(WRAPPED_KEY);
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.astra_wrapped_vault_key || null;
}

export async function saveWrappedVaultKey(wrappedKey) {
  if (isFallbackMode) {
    localSet(WRAPPED_KEY, wrappedKey);
    return;
  }
  await supabase.auth.updateUser({
    data: { astra_wrapped_vault_key: wrappedKey }
  });
}

export async function loadPrfEnabled() {
  if (isFallbackMode) {
    return localGet(PRF_ENABLED_KEY) === 'true';
  }
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user?.user_metadata?.astra_passkey_prf_enabled);
}

export async function savePrfEnabled(enabled) {
  if (isFallbackMode) {
    localSet(PRF_ENABLED_KEY, enabled ? 'true' : null);
    return;
  }
  await supabase.auth.updateUser({
    data: { astra_passkey_prf_enabled: enabled }
  });
}

export async function clearStoredPasskey() {
  if (isFallbackMode) {
    localSet(CREDENTIAL_KEY, null);
    localSet(WRAPPED_KEY, null);
    localSet(PRF_ENABLED_KEY, null);
    return;
  }
  await supabase.auth.updateUser({
    data: {
      astra_passkey_credential_id: null,
      astra_wrapped_vault_key: null,
      astra_passkey_prf_enabled: null
    }
  });
}

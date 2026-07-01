import { supabase } from './dbClient.js';

export async function loadStoredCredential() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.astra_passkey_credential_id || null;
}

export async function saveStoredCredential(credentialId) {
  const { error } = await supabase.auth.updateUser({
    data: { astra_passkey_credential_id: credentialId },
  });
  if (error) throw error;
}

export async function loadWrappedVaultKey() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.astra_wrapped_vault_key || null;
}

export async function saveWrappedVaultKey(wrappedKey) {
  const { error } = await supabase.auth.updateUser({
    data: { astra_wrapped_vault_key: wrappedKey },
  });
  if (error) throw error;
}

export async function loadPrfEnabled() {
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user?.user_metadata?.astra_passkey_prf_enabled);
}

export async function savePrfEnabled(enabled) {
  const { error } = await supabase.auth.updateUser({
    data: { astra_passkey_prf_enabled: enabled },
  });
  if (error) throw error;
}

export async function clearStoredPasskey() {
  const { error } = await supabase.auth.updateUser({
    data: {
      astra_passkey_credential_id: null,
      astra_wrapped_vault_key: null,
      astra_passkey_prf_enabled: null,
    },
  });
  if (error) throw error;
}

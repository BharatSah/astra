import { supabase } from './dbClient.js';

// Model: passwords (vault entries). Data-access layer over the `passwords` table.
// Note: encryption/decryption is handled in the service layer (cryptoService);
// this model only persists the (already-encrypted) password string.
export async function fetchPasswords() {
  const { data, error } = await supabase.from('passwords').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPassword(payload) {
  const { error } = await supabase.from('passwords').insert(payload);
  if (error) throw error;
}

export async function updatePassword(id, payload) {
  const { error } = await supabase.from('passwords').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deletePassword(id) {
  const { error } = await supabase.from('passwords').delete().eq('id', id);
  if (error) throw error;
}

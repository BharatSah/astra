import { supabase } from './dbClient.js';

// Model: customers (expiry rules). Data-access layer over the `customers` table.
export async function fetchCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('expiry_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCustomer(payload) {
  const { error } = await supabase.from('customers').insert(payload);
  if (error) throw error;
}

export async function updateCustomer(id, payload) {
  const { error } = await supabase.from('customers').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteCustomer(id) {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

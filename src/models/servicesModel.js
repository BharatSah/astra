import { supabase } from './dbClient.js';

// Model: services. Thin data-access layer over the `services` table.
export async function fetchServices() {
  const { data, error } = await supabase.from('services').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createService({ name, description, logo }) {
  const { error } = await supabase.from('services').insert({ name, description, logo });
  if (error) throw error;
}

export async function updateService(id, { name, description, logo }) {
  const { error } = await supabase.from('services').update({ name, description, logo }).eq('id', id);
  if (error) throw error;
}

export async function deleteService(id) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}

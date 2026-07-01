import { supabase } from './dbClient.js';

// Model: platforms. Data-access layer over the `platforms` table.
export async function fetchPlatforms() {
  const { data, error } = await supabase.from('platforms').select('*').order('platform_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createPlatform({ platform_name, url, logo }) {
  const { error } = await supabase.from('platforms').insert({ platform_name, url, logo });
  if (error) throw error;
}

export async function updatePlatform(originalName, { platform_name, url, logo }) {
  const { error } = await supabase
    .from('platforms')
    .update({ platform_name, url, logo })
    .eq('platform_name', originalName);
  if (error) throw error;
}

export async function deletePlatform(name) {
  const { error } = await supabase.from('platforms').delete().eq('platform_name', name);
  if (error) throw error;
}

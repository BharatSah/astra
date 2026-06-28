import { supabase } from './dbClient.js';

// Model: system_settings. Data-access layer over the `system_settings` table.
// Settings are stored as key/value (JSONB) rows; callers pick out keys.
export async function fetchAllSettings() {
  const { data, error } = await supabase.from('system_settings').select('*');
  if (error) throw error;
  return data || [];
}

export async function fetchSettingsObject() {
  const rows = await fetchAllSettings();
  const obj = {};
  rows.forEach(row => { obj[row.key] = row.value; });
  return obj;
}

export async function upsertSetting(key, value) {
  const { error } = await supabase.from('system_settings').upsert({ key, value });
  if (error) throw error;
}

import { supabase } from './dbClient.js';

// Model: email_logs. Data-access layer over the `email_logs` table.
export async function insertEmailLog({ recipient, subject, body, status = 'sent' }) {
  const { error } = await supabase.from('email_logs').insert({ recipient, subject, body, status });
  if (error) throw error;
}

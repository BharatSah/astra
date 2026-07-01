import { supabase } from './dbClient.js';

function mapEmailLogRow(row) {
  return {
    id: row.id,
    recipient: row.recipient,
    subject: row.subject,
    body: row.body,
    sent_at: row.sent_at,
    status: row.status || 'sent',
    type: row.email_type || 'System Notification',
    error: row.error_message || null,
  };
}

// Model: email_logs. Data-access layer over the `email_logs` table.
export async function fetchEmailLogs() {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEmailLogRow);
}

export async function insertEmailLog({
  recipient,
  subject,
  body,
  status = 'sent',
  type,
  error,
}) {
  const { data, error: dbError } = await supabase
    .from('email_logs')
    .insert({
      recipient,
      subject,
      body,
      status,
      email_type: type || null,
      error_message: error || null,
    })
    .select();
  if (dbError) throw dbError;
  return data?.[0] ? mapEmailLogRow(data[0]) : null;
}

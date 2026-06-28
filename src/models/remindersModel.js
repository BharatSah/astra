import { supabase } from './dbClient.js';

// Model: payment_reminders. Data-access layer over the `payment_reminders` table.
export async function fetchReminders() {
  const { data, error } = await supabase.from('payment_reminders').select('*').order('to_pay_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createReminder(payload) {
  const { error } = await supabase.from('payment_reminders').insert(payload);
  if (error) throw error;
}

export async function updateReminder(id, payload) {
  const { error } = await supabase.from('payment_reminders').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteReminder(id) {
  const { error } = await supabase.from('payment_reminders').delete().eq('id', id);
  if (error) throw error;
}

export async function markReminderPaid(id) {
  const { error } = await supabase.from('payment_reminders').update({ status: 'paid' }).eq('id', id);
  if (error) throw error;
}

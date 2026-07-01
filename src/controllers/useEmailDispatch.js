import { useState, useEffect, useCallback } from 'react';
import { fetchEmailLogs, insertEmailLog } from '../models/emailLogsModel.js';
import { sendEmail } from '../services/emailDeliveryService.js';

export function useEmailDispatch(notify, sessionReady = true) {
  const [emailLogs, setEmailLogs] = useState([]);

  const loadLogs = useCallback(async () => {
    const rows = await fetchEmailLogs();
    setEmailLogs(rows);
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    loadLogs().catch((e) => {
      console.error('Failed to load email logs from Supabase:', e.message);
      notify('error', 'Could not load email logs from Supabase.');
    });
  }, [sessionReady, loadLogs, notify]);

  const triggerEmail = useCallback(async (emailObj) => {
    if (!emailObj?.recipient || !emailObj?.subject || !emailObj?.body) {
      notify('error', 'Email is missing recipient, subject, or body.');
      return;
    }

    const result = await sendEmail({
      to: emailObj.recipient,
      subject: emailObj.subject,
      textBody: emailObj.body,
      emailType: emailObj.type,
    });

    if (result.source === 'edge') {
      await loadLogs();
    } else if (result.success) {
      try {
        const saved = await insertEmailLog({
          recipient: emailObj.recipient,
          subject: emailObj.subject,
          body: emailObj.body,
          status: 'sent',
          type: emailObj.type,
        });
        if (saved) {
          setEmailLogs(prev => [saved, ...prev.filter(l => l.id !== saved.id)]);
        }
      } catch (e) {
        console.error('Supabase email log insert failed:', e.message);
        notify('warning', 'Email sent but log could not be saved to Supabase.');
      }
    } else {
      try {
        const saved = await insertEmailLog({
          recipient: emailObj.recipient,
          subject: emailObj.subject,
          body: emailObj.body,
          status: 'failed',
          type: emailObj.type,
          error: result.error,
        });
        if (saved) {
          setEmailLogs(prev => [saved, ...prev.filter(l => l.id !== saved.id)]);
        }
      } catch (e) {
        console.error('Supabase email log insert failed:', e.message);
      }
    }

    if (result.success) {
      notify('success', `Email sent to ${emailObj.recipient}!`);
    } else {
      notify('error', `Failed to send email to ${emailObj.recipient}: ${result.error}`);
    }
  }, [notify, loadLogs]);

  return { emailLogs, triggerEmail, refreshEmailLogs: loadLogs };
}

import { useState, useEffect, useCallback } from 'react';
import { isFallbackMode } from '../models/dbClient.js';
import { insertEmailLog } from '../models/emailLogsModel.js';
import { sendEmail } from '../services/emailDeliveryService.js';

// Controller: SMTP email dispatch via the Supabase send-email Edge Function.
// Falls back to simulated local-only dispatch when running in fallback/offline mode.
export function useEmailDispatch(notify) {
  const [emailLogs, setEmailLogs] = useState([]);

  useEffect(() => {
    const savedDb = localStorage.getItem('astra_db');
    if (savedDb) {
      try {
        const parsed = JSON.parse(savedDb);
        if (parsed.email_logs) setEmailLogs(parsed.email_logs);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const triggerEmail = useCallback(async (emailObj) => {
    const result = await sendEmail({
      to: emailObj.recipient,
      subject: emailObj.subject,
      textBody: emailObj.body,
    });

    const timestamp = new Date().toISOString();
    const status = result.success ? 'sent' : 'failed';
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      sent_at: timestamp,
      status,
      error: result.error,
      ...emailObj,
    };

    setEmailLogs(prev => {
      const updatedLogs = [newLog, ...prev];
      const savedDb = localStorage.getItem('astra_db');
      if (savedDb) {
        try {
          const parsed = JSON.parse(savedDb);
          parsed.email_logs = updatedLogs;
          localStorage.setItem('astra_db', JSON.stringify(parsed));
        } catch (e) {
          console.error(e);
        }
      }
      return updatedLogs;
    });

    if (!isFallbackMode) {
      try {
        await insertEmailLog({
          recipient: emailObj.recipient,
          subject: emailObj.subject,
          body: emailObj.body,
          status,
        });
      } catch (e) {
        console.warn('Supabase email logs sync failed:', e.message);
      }
    }

    if (result.success) {
      const label = result.source === 'simulated' ? 'Simulated dispatch' : 'Email sent';
      notify('success', `${label} to ${emailObj.recipient}!`);
    } else {
      notify('error', `Failed to send email to ${emailObj.recipient}: ${result.error}`);
    }
  }, [notify]);

  return { emailLogs, triggerEmail };
}

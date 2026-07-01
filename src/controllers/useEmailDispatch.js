import { useState, useEffect, useCallback } from 'react';
import { isFallbackMode } from '../models/dbClient.js';
import { fetchEmailLogs, insertEmailLog } from '../models/emailLogsModel.js';
import { sendEmail } from '../services/emailDeliveryService.js';
import { seedData } from '../models/seedData.js';

function loadLocalEmailLogs() {
  const savedDb = localStorage.getItem('astra_db');
  if (!savedDb) return [];
  try {
    const parsed = JSON.parse(savedDb);
    return parsed.email_logs || [];
  } catch {
    return [];
  }
}

function saveLocalEmailLogs(logs) {
  let parsed;
  try {
    parsed = JSON.parse(localStorage.getItem('astra_db') || 'null');
  } catch {
    parsed = null;
  }
  if (!parsed) {
    parsed = structuredClone(seedData);
  }
  parsed.email_logs = logs;
  localStorage.setItem('astra_db', JSON.stringify(parsed));
}

// Controller: SMTP email dispatch via the Supabase send-email Edge Function.
// Falls back to simulated local-only dispatch when running in fallback/offline mode.
export function useEmailDispatch(notify, sessionReady = true) {
  const [emailLogs, setEmailLogs] = useState([]);

  const loadLogs = useCallback(async () => {
    if (isFallbackMode) {
      setEmailLogs(loadLocalEmailLogs());
      return;
    }
    try {
      const rows = await fetchEmailLogs();
      setEmailLogs(rows);
    } catch (e) {
      console.warn('Failed to load email logs from Supabase:', e.message);
      setEmailLogs(loadLocalEmailLogs());
    }
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    loadLogs();
  }, [sessionReady, loadLogs]);

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

    const timestamp = new Date().toISOString();
    const status = result.success ? 'sent' : 'failed';
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      sent_at: timestamp,
      status,
      error: result.error || null,
      ...emailObj,
    };

    if (isFallbackMode) {
      setEmailLogs(prev => {
        const updatedLogs = [newLog, ...prev];
        saveLocalEmailLogs(updatedLogs);
        return updatedLogs;
      });
    } else if (result.source === 'edge') {
      await loadLogs();
    } else {
      try {
        const saved = await insertEmailLog({
          recipient: emailObj.recipient,
          subject: emailObj.subject,
          body: emailObj.body,
          status,
          type: emailObj.type,
          error: result.error,
        });
        if (saved) {
          setEmailLogs(prev => [saved, ...prev.filter(l => l.id !== saved.id)]);
        } else {
          setEmailLogs(prev => [newLog, ...prev]);
        }
      } catch (e) {
        console.warn('Supabase email logs sync failed:', e.message);
        setEmailLogs(prev => [newLog, ...prev]);
      }
    }

    if (result.success) {
      const label = result.source === 'simulated' ? 'Simulated dispatch' : 'Email sent';
      notify('success', `${label} to ${emailObj.recipient}!`);
    } else {
      notify('error', `Failed to send email to ${emailObj.recipient}: ${result.error}`);
    }
  }, [notify, loadLogs]);

  return { emailLogs, triggerEmail, refreshEmailLogs: loadLogs };
}

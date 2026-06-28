import { useState, useEffect, useCallback } from 'react';
import { isFallbackMode } from '../models/dbClient.js';
import { insertEmailLog } from '../models/emailLogsModel.js';

// Controller: simulated SMTP email dispatch. Owns the in-memory email log list,
// persists to localStorage (fallback db) and syncs to Supabase when online.
// Mirrors the original App.jsx handleTriggerEmail + initial-load behaviour.
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
    const timestamp = new Date().toISOString();
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      sent_at: timestamp,
      status: 'sent',
      ...emailObj
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
          status: 'sent'
        });
      } catch (e) {
        console.warn('Supabase email logs sync failed, running in fallback local:', e.message);
      }
    }

    notify('success', `SMTP Alert dispatched to ${emailObj.recipient}!`);
  }, [notify]);

  return { emailLogs, triggerEmail };
}

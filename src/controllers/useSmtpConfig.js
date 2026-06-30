import { useState, useEffect, useCallback } from 'react';
import { fetchSettingsObject, upsertSetting } from '../models/settingsModel.js';
import { testSmtpConnection } from '../services/emailDeliveryService.js';

// Controller: SMTP config + email templates + diagnostics. Owns settings load,
// save (smtp_config / email_templates upsert), token insertion, and the staged
// local SMTP diagnostic simulation.
export function useSmtpConfig({ notify }) {
  const [smtp, setSmtp] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: '',
    password: '',
    senderName: 'Astra Notifications',
    senderEmail: ''
  });
  const [templates, setTemplates] = useState({
    expiry_warning: { subject: '', body: '' },
    expiry_expired: { subject: '', body: '' },
    email_recipient: { to_email: '', warning_recipient_type: 'admin', expired_recipient_type: 'customer' },
    payment_reminder: { subject: '', body: '' }
  });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testLogs, setTestLogs] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const settings = await fetchSettingsObject();
      if (settings.smtp_config) setSmtp(settings.smtp_config);
      if (settings.email_templates) setTemplates(settings.email_templates);
    } catch (err) {
      console.error('Error fetching system settings:', err.message);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const saveSmtp = useCallback(async () => {
    setSavingSmtp(true);
    try {
      await upsertSetting('smtp_config', smtp);
      notify('success', 'SMTP settings saved successfully');
      return true;
    } catch (err) {
      console.error('Error saving SMTP settings:', err.message);
      notify('error', 'Failed to save SMTP settings');
      return false;
    } finally {
      setSavingSmtp(false);
    }
  }, [smtp, notify]);

  const saveTemplates = useCallback(async () => {
    setSavingTemplates(true);
    try {
      await upsertSetting('email_templates', templates);
      notify('success', 'Email templates saved successfully');
      return true;
    } catch (err) {
      console.error('Error saving templates:', err.message);
      notify('error', 'Failed to save templates');
      return false;
    } finally {
      setSavingTemplates(false);
    }
  }, [templates, notify]);

  const insertToken = useCallback((fieldKey, token, selectedTemplateKey) => {
    const element = document.getElementById(`${selectedTemplateKey}_${fieldKey}`);
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const text = element.value;
    const newVal = text.slice(0, start) + token + text.slice(end);
    setTemplates(prev => ({
      ...prev,
      [selectedTemplateKey]: { ...prev[selectedTemplateKey], [fieldKey]: newVal }
    }));
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(start + token.length, start + token.length);
    });
  }, []);

  const runDiagnostic = useCallback(async () => {
    setTestingConnection(true);
    setTestLogs(['Invoking send-email edge function...']);

    const testTo = templates.email_recipient?.to_email || smtp.senderEmail || smtp.username;
    if (!testTo) {
      setTestLogs(prev => [...prev, 'ERROR: Set an admin email in Templates or SMTP sender address.']);
      setTestingConnection(false);
      notify('error', 'Set an admin recipient email before testing SMTP.');
      return;
    }

    setTestLogs(prev => [...prev, `Target: ${smtp.host}:${smtp.port || 587}`, `Sending test email to ${testTo}...`]);

    const result = await testSmtpConnection({
      to: testTo,
      subject: 'Astra SMTP Test',
      textBody: 'This is a test email from Astra. If you received this, SMTP is working correctly.',
    });

    if (result.success) {
      setTestLogs(prev => [...prev, `SUCCESS: ${result.message || 'Test email dispatched.'}`]);
      notify('success', `Test email sent to ${testTo}`);
    } else {
      setTestLogs(prev => [...prev, `FAILED: ${result.error}`]);
      notify('error', result.error || 'SMTP test failed');
    }
    setTestingConnection(false);
  }, [smtp, templates.email_recipient?.to_email, notify]);

  return {
    smtp, setSmtp, templates, setTemplates,
    savingSmtp, savingTemplates, testingConnection, testLogs,
    refresh, saveSmtp, saveTemplates, insertToken, runDiagnostic
  };
}
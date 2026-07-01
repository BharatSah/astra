import { useState, useEffect, useCallback } from 'react';
import { fetchReminders, createReminder, updateReminder, deleteReminder, markReminderPaid } from '../models/remindersModel.js';
import { fetchServices } from '../models/servicesModel.js';
import { fetchSettingsObject } from '../models/settingsModel.js';
import { computePaymentStatus } from '../services/dateService.js';
import { fillTemplate, buildPaymentContext } from '../services/emailTemplateService.js';

// Controller: payment reminders. Owns reminder/service/template fetch, CRUD,
// mark-as-paid, and the reminder email trigger (recipient from settings).
export function usePayments({ notify, triggerEmail }) {
  const [reminders, setReminders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesData, remindersData, settings] = await Promise.all([
        fetchServices(),
        fetchReminders(),
        fetchSettingsObject()
      ]);
      setServices(servicesData);
      setReminders(remindersData);
      setTemplates(settings.email_templates || null);
    } catch (err) {
      console.error(err);
      notify('error', 'Error loading payment reminders data');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveReminder = useCallback(async (form) => {
    const { editingId, status, ...rest } = form;
    const finalStatus = computePaymentStatus(rest.to_pay_date, status);
    const record = { ...rest, status: finalStatus };
    try {
      if (editingId) {
        await updateReminder(editingId, record);
        notify('success', 'Reminder updated successfully');
      } else {
        await createReminder(record);
        notify('success', 'Reminder scheduled successfully');
      }
      await refresh();
      return true;
    } catch (err) {
      console.error(err);
      notify('error', 'Error scheduling reminder');
      return false;
    }
  }, [notify, refresh]);

  const removeReminder = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this payment reminder?')) return false;
    try {
      await deleteReminder(id);
      notify('success', 'Reminder deleted');
      await refresh();
      return true;
    } catch (err) {
      console.error(err);
      notify('error', 'Error deleting reminder');
      return false;
    }
  }, [notify, refresh]);

  const markPaid = useCallback(async (rem) => {
    try {
      await markReminderPaid(rem.id);
      notify('success', `Payment for ${rem.customer_name} marked as paid!`);
      await refresh();
    } catch (err) {
      console.error(err);
      notify('error', 'Error updating payment status');
    }
  }, [notify, refresh]);

  const triggerReminderEmail = useCallback((rem) => {
    if (!templates) {
      notify('warning', 'Templates not loaded. Configure settings first.');
      return;
    }
    const serviceObj = services.find(s => s.id === rem.service_id);
    const serviceName = serviceObj ? serviceObj.name : 'Selected Service';
    const recipient = templates.email_recipient?.to_email?.trim();
    if (!recipient) {
      notify('warning', 'Set an admin email in Email & SMTP → Templates before sending reminders.');
      return;
    }

    const ctx = buildPaymentContext({ reminder: rem, serviceName });
    const subject = fillTemplate(templates.payment_reminder?.subject || 'Payment Reminder', ctx);
    const body = fillTemplate(templates.payment_reminder?.body || 'A payment of {amount} is due.', ctx);

    triggerEmail({ recipient, subject, body, type: 'Payment Reminder' });
  }, [templates, services, notify, triggerEmail]);

  return {
    reminders, services, loading, templates,
    refresh, saveReminder, removeReminder, markPaid, triggerReminderEmail
  };
}
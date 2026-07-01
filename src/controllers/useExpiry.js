import { useState, useEffect, useCallback } from 'react';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../models/customersModel.js';
import { fetchServices } from '../models/servicesModel.js';
import { fetchSettingsObject } from '../models/settingsModel.js';
import { daysUntil, computeExpiryStatus } from '../services/dateService.js';
import { buildExpiryContext, resolveCustomerRecipients, resolveEmailPayload } from '../services/emailTemplateService.js';

export function useExpiry({ notify, triggerEmail }) {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [templates, setTemplates] = useState(null);

  const dispatchExpiryEmail = useCallback((customer, servicesData, tpl, opts = {}) => {
    const serviceObj = servicesData.find(s => s.id === customer.service_id);
    const serviceName = serviceObj ? serviceObj.name : 'Service';
    const daysLeft = daysUntil(customer.expiry_date);
    const isExpired = daysLeft <= 0;

    const templateKey = isExpired ? 'expiry_expired' : 'expiry_warning';
    const template = tpl?.[templateKey];
    if (!template?.subject || !template?.body) {
      if (opts.notify !== false) {
        notify('warning', 'Email template not configured. Set templates in Email & SMTP settings.');
      }
      return;
    }

    const ctx = buildExpiryContext({ customer, serviceName, daysLeft });
    const payload = resolveEmailPayload(template, ctx);
    const emailType = opts.emailType || (isExpired ? 'Service Expired Alert' : 'Expiry Warning Alert');

    const recipients = resolveCustomerRecipients(customer, tpl?.email_recipient, { isExpired });
    if (!recipients.length) {
      if (opts.notify !== false) {
        notify('warning', 'No recipient email configured. Set admin email in Email & SMTP or add customer email.');
      }
      return;
    }
    recipients.forEach(recipient => {
      triggerEmail({
        recipient,
        subject: payload.subject,
        textBody: payload.textBody,
        htmlBody: payload.htmlBody,
        type: emailType,
      });
    });
  }, [triggerEmail, notify]);

  const fetchAll = useCallback(async () => {
    try {
      const [servicesData, customersData, settings] = await Promise.all([
        fetchServices(),
        fetchCustomers(),
        fetchSettingsObject(),
      ]);
      setServices(servicesData);
      const tpl = settings.email_templates || null;
      setTemplates(tpl);

      const todayStr = new Date().toISOString().split('T')[0];

      const processed = customersData.map(cust => {
        const status = computeExpiryStatus(cust.expiry_date, cust.notify_before_days);
        if (
          status === 'expired' &&
          cust.send_email_reminder !== false &&
          (cust.recipient_emails || cust.email) &&
          cust.last_auto_expired_email_date !== todayStr
        ) {
          dispatchExpiryEmail(cust, servicesData, tpl, { emailType: 'Auto Expired Alert', notify: false });
          updateCustomer(cust.id, { last_auto_expired_email_date: todayStr }).catch(err => {
            console.error('Failed to record auto-expired email date:', err);
          });
        }
        return { ...cust, status };
      });
      setCustomers(processed);
    } catch (err) {
      console.error(err);
      notify('error', 'Error loading expiry data from Supabase');
    }
  }, [notify, dispatchExpiryEmail]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCustomer = useCallback(async (form) => {
    const { editingId, ...payload } = form;
    const status = computeExpiryStatus(payload.expiry_date, payload.notify_before_days);
    const record = { ...payload, status };
    try {
      if (editingId) {
        await updateCustomer(editingId, record);
        notify('success', `Rule for ${payload.cname} has been updated`);
      } else {
        await createCustomer(record);
        notify('success', `Rule for ${payload.cname} has been created`);
      }
      await fetchAll();
      return true;
    } catch (err) {
      console.error('Supabase error:', err);
      notify('error', err.message || 'Failed to save rule information');
      return false;
    }
  }, [notify, fetchAll]);

  const removeCustomer = useCallback(async (id, name) => {
    if (!confirm(`Are you sure you want to permanently delete rule ${name}?`)) return false;
    try {
      await deleteCustomer(id);
      notify('success', 'Expiry rule deleted successfully');
      await fetchAll();
      return true;
    } catch (err) {
      console.error(err);
      notify('error', 'Error deleting expiry rule');
      return false;
    }
  }, [notify, fetchAll]);

  const triggerWarning = useCallback((customer) => {
    if (!templates) {
      notify('warning', 'Email templates not loaded. Configure in Email & SMTP first.');
      return;
    }
    dispatchExpiryEmail(customer, services, templates);
  }, [templates, services, notify, dispatchExpiryEmail]);

  return {
    customers, services, templates,
    refresh: fetchAll,
    saveCustomer, removeCustomer, triggerWarning,
  };
}

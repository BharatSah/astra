import { useState, useEffect, useCallback } from 'react';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../models/customersModel.js';
import { fetchServices } from '../models/servicesModel.js';
import { fetchSettingsObject } from '../models/settingsModel.js';
import { daysUntil, computeExpiryStatus } from '../services/dateService.js';
import { fillTemplate, buildExpiryContext, resolveCustomerRecipients } from '../services/emailTemplateService.js';

// Controller: expiry management. Owns customer/service/template fetch, the
// auto-send-expired-email-on-load side effect (gated by a per-day localStorage
// key), CRUD handlers, and the manual warning/expire email trigger.
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
    const fallbackSubject = isExpired
      ? 'Critical: Your service {service_name} has expired'
      : 'Warning: Your service {service_name} expires in {days} days';
    const fallbackBody = isExpired
      ? 'Dear {customer_name},\n\nYour service {service_name} expired on {expiry_date}.\n\nPlease renew immediately.\n\nBest regards,\nAstra'
      : 'Dear {customer_name},\n\nThis is an automated reminder that your subscription for {service_name} is expiring on {expiry_date}.\n\nPlease renew it to avoid service interruption.\n\nBest regards,\nAstra';

    const ctx = buildExpiryContext({ customer, serviceName, daysLeft });
    const subject = fillTemplate(tpl?.[templateKey]?.subject || fallbackSubject, ctx);
    const body = fillTemplate(tpl?.[templateKey]?.body || fallbackBody, ctx);
    const emailType = opts.emailType || (isExpired ? 'Service Expired Alert' : 'Expiry Warning Alert');

    const recipients = resolveCustomerRecipients(customer);
    recipients.forEach(recipient => {
      triggerEmail({ recipient, subject, body, type: emailType });
    });
  }, [triggerEmail]);

  const fetchAll = useCallback(async () => {
    try {
      const [servicesData, customersData, settings] = await Promise.all([
        fetchServices(),
        fetchCustomers(),
        fetchSettingsObject()
      ]);
      setServices(servicesData);
      const tpl = settings.email_templates || null;
      setTemplates(tpl);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processed = customersData.map(cust => {
        const status = computeExpiryStatus(cust.expiry_date, cust.notify_before_days);
        // Auto-send expired emails on load (once per customer per day).
        if (status === 'expired' && (cust.recipient_emails || cust.email)) {
          const sentKey = `expiry_sent_${cust.id}_${today.toISOString().split('T')[0]}`;
          if (!localStorage.getItem(sentKey)) {
            localStorage.setItem(sentKey, 'true');
            dispatchExpiryEmail(cust, servicesData, tpl, { emailType: 'Auto Expired Alert' });
          }
        }
        return { ...cust, status };
      });
      setCustomers(processed);
    } catch (err) {
      console.error(err);
      notify('error', 'Error loading expiry configuration data');
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
      notify('error', err.message || JSON.stringify(err) || 'Failed to save rule information');
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
      notify('warning', 'Email templates not loaded. Configure in Settings first.');
      return;
    }
    dispatchExpiryEmail(customer, services, templates);
  }, [templates, services, notify, dispatchExpiryEmail]);

  return {
    customers, services, templates,
    refresh: fetchAll,
    saveCustomer, removeCustomer, triggerWarning
  };
}

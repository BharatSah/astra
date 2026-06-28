// Email template token replacement. Consolidates the subject/body interpolation
// logic that was duplicated in ExpiryManagement, PaymentReminders, and SmtpConfig.

const TOKEN_RE = /\{(\w+)\}/g;

// Replace {token} placeholders in a template string with values from ctx.
export function fillTemplate(template, ctx) {
  if (!template) return '';
  return template.replace(TOKEN_RE, (_, key) =>
    ctx[key] !== undefined && ctx[key] !== null ? String(ctx[key]) : `{${key}}`
  );
}

// Build the interpolation context for an expiry (warning/expired) email.
export function buildExpiryContext({ customer, serviceName, daysLeft }) {
  return {
    customer_name: customer.cname,
    service_name: serviceName,
    days: Math.max(0, daysLeft),
    expiry_date: customer.expiry_date
  };
}

// Build the interpolation context for a payment-reminder email.
export function buildPaymentContext({ reminder, serviceName }) {
  const currencySymbol = reminder.currency === 'USD' ? '$' : 'Rs. ';
  const formattedAmount = `${currencySymbol}${reminder.amount}`;
  return {
    customer_name: reminder.customer_name,
    service_name: serviceName,
    amount: formattedAmount,
    currency: reminder.currency,
    due_date: reminder.to_pay_date
  };
}

// Resolve recipients for a customer expiry email: custom comma list or the
// customer's primary email.
export function resolveCustomerRecipients(customer) {
  if (customer.recipient_emails) {
    return customer.recipient_emails.split(',').map(e => e.trim()).filter(Boolean);
  }
  return [customer.email];
}

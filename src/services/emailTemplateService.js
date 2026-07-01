// Email template token replacement. Consolidates the subject/body interpolation
// logic that was duplicated in ExpiryManagement, PaymentReminders, and SmtpConfig.

const TOKEN_RE = /\{(\w+)\}/g;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Replace {token} placeholders in a template string with values from ctx.
export function fillTemplate(template, ctx) {
  if (!template) return '';
  return template.replace(TOKEN_RE, (_, key) =>
    ctx[key] !== undefined && ctx[key] !== null ? String(ctx[key]) : `{${key}}`
  );
}

// Replace tokens in HTML templates with escaped values to prevent injection.
export function fillHtmlTemplate(template, ctx) {
  if (!template) return '';
  return template.replace(TOKEN_RE, (_, key) => {
    if (ctx[key] === undefined || ctx[key] === null) return `{${key}}`;
    return escapeHtml(String(ctx[key]));
  });
}

// Strip dangerous tags/attributes from admin-authored HTML templates.
export function sanitizeEmailHtml(html) {
  if (!html) return '';
  let out = String(html);
  out = out.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  out = out.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  out = out.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  out = out.replace(/<embed\b[^>]*>/gi, '');
  out = out.replace(/\s+on\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');
  out = out.replace(/href\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, 'href="#"');
  return out;
}

export function htmlToPlainText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|td)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Wrap plain text as simple HTML when switching from Plain to HTML mode.
export function plainTextToHtml(text) {
  if (!text) return '';
  return String(text)
    .split(/\n\n+/)
    .map((paragraph) => {
      const lines = paragraph.split('\n').join('<br/>');
      return `<p style="margin:0 0 12px;font-family:Arial,sans-serif;color:#374151;line-height:1.5;">${lines}</p>`;
    })
    .join('\n');
}

export function isHtmlTemplate(template) {
  return template?.format === 'html';
}

// Build subject + plain/HTML bodies from a saved template and token context.
export function resolveEmailPayload(template, ctx) {
  const subject = fillTemplate(template?.subject || '', ctx);
  const format = isHtmlTemplate(template) ? 'html' : 'plain';

  if (format === 'html') {
    const htmlBody = sanitizeEmailHtml(fillHtmlTemplate(template?.body || '', ctx));
    return { subject, textBody: htmlToPlainText(htmlBody), htmlBody, format };
  }

  const textBody = fillTemplate(template?.body || '', ctx);
  return { subject, textBody, htmlBody: null, format };
}

// Preview body HTML for the template editor (plain text is escaped).
export function previewTemplateBody(template, ctx) {
  if (isHtmlTemplate(template)) {
    const html = sanitizeEmailHtml(fillHtmlTemplate(template?.body || '', ctx));
    return { html, format: 'html' };
  }
  const filled = fillTemplate(template?.body || '', ctx);
  const plain = htmlToPlainText(filled);
  const escaped = escapeHtml(plain);
  return { html: escaped.split('\n').join('<br />'), format: 'plain' };
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

// Resolve recipients for a customer expiry email using template routing rules,
// then custom comma list or the customer's primary email.
export function resolveCustomerRecipients(customer, emailRecipientConfig, { isExpired } = {}) {
  const config = emailRecipientConfig || {};
  const routeToAdmin = isExpired
    ? config.expired_recipient_type === 'admin'
    : config.warning_recipient_type === 'admin';

  if (routeToAdmin) {
    const adminEmail = config.to_email?.trim();
    if (adminEmail) return [adminEmail];
  }

  if (customer.recipient_emails) {
    return customer.recipient_emails.split(',').map(e => e.trim()).filter(Boolean);
  }
  return customer.email ? [customer.email] : [];
}

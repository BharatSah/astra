// Date helpers shared across Dashboard, Expiry, and Payment views.
// All comparisons normalize to local midnight to match the original logic.

export function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = new Date(dateStr) - today;
  return Math.ceil(diff / (1000 * 3600 * 24));
}

// Compute the expiry status for a customer row given its notify window.
export function computeExpiryStatus(expiryDate, notifyBeforeDays) {
  const days = daysUntil(expiryDate);
  if (days <= 0) return 'expired';
  if (days <= notifyBeforeDays) return 'warning';
  return 'active';
}

// Recompute payment status: paid rows stay paid; others become overdue/pending
// based on the due date relative to today.
export function computePaymentStatus(toPayDate, currentStatus) {
  if (currentStatus === 'paid') return 'paid';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(toPayDate) < today ? 'overdue' : 'pending';
}

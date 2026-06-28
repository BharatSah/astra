import { useState, useEffect, useCallback } from 'react';
import { fetchCustomers } from '../models/customersModel.js';
import { fetchServices } from '../models/servicesModel.js';
import { fetchPasswords } from '../models/passwordsModel.js';
import { fetchReminders } from '../models/remindersModel.js';
import { daysUntil } from '../services/dateService.js';

// Controller: dashboard aggregation. Fetches counts across entities and derives
// "expiring soon" / "pending dues" slices, plus the recent timelines shown on
// the dashboard. Errors are logged but non-fatal (dashboard renders zeros).
export function useDashboard() {
  const [stats, setStats] = useState({
    customers: 0, services: 0, passwords: 0, pendingReminders: 0, expiringSoon: 0
  });
  const [recentExpiries, setRecentExpiries] = useState([]);
  const [recentReminders, setRecentReminders] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const [custData, servData, pwData, remData] = await Promise.all([
        fetchCustomers(), fetchServices(), fetchPasswords(), fetchReminders()
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiring = custData.filter(c => {
        const days = daysUntil(c.expiry_date);
        return days > 0 && days <= c.notify_before_days;
      }).length;

      const pending = remData.filter(r => r.status !== 'paid').length;

      setStats({
        customers: custData.length,
        services: servData.length,
        passwords: pwData.length,
        pendingReminders: pending,
        expiringSoon: expiring
      });

      const upcomingExps = custData
        .filter(c => daysUntil(c.expiry_date) <= 15)
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
        .slice(0, 5);

      const upcomingRems = remData
        .filter(r => r.status !== 'paid')
        .sort((a, b) => new Date(a.to_pay_date) - new Date(b.to_pay_date))
        .slice(0, 5);

      setRecentExpiries(upcomingExps);
      setRecentReminders(upcomingRems);
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, recentExpiries, recentReminders, refresh };
}
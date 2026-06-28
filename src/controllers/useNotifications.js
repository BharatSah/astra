import { useState, useCallback } from 'react';

// Controller: global toast notifications. Replaces the inline notifications
// state and handleNotify that lived in App.jsx. Toasts auto-dismiss after 4s.
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((type, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  return { notifications, notify, dismiss };
}

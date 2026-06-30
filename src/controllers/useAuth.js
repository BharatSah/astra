import { useState, useEffect, useCallback } from 'react';
import { supabase, isFallbackMode } from '../models/dbClient.js';
import { 
  getStoredLoginPassword, 
  hasStoredLoginPassword,
  setStoredLoginPassword
} from '../models/authModel.js';
import { hashPassword, verifyPassword } from '../services/passwordHashService.js';
import {
  hasRegisteredPasskey,
  registerPasskey,
  authenticatePasskey,
  generateVaultPassphrase,
  wrapVaultPassphrase,
  unwrapVaultPassphrase,
} from '../services/passkeyService.js';

// Controller: authentication + current-user session. Lifts the auth state and
// handlers out of App.jsx (Supabase session in online mode, localStorage in
// fallback/test mode) into a reusable hook.
const DEFAULT_USER = {
  username: 'bharat.shah',
  email: 'bharat.shah@mithilacoders.com',
  avatar: 'B',
  role: 'Administrator'
};

const isTestMode = import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  window.location.search.includes('test=true');

function getUserFromSession(user) {
  const email = user?.email || DEFAULT_USER.email;
  const metadata = user?.user_metadata || {};
  const appMetadata = user?.app_metadata || {};
  const username = metadata.username || metadata.name || email.split('@')[0] || DEFAULT_USER.username;
  const avatar = metadata.avatar_url || metadata.avatar || username.charAt(0).toUpperCase();
  return {
    username,
    email,
    avatar,
    role: appMetadata.role || metadata.role || DEFAULT_USER.role
  };
}

function isPasskeySupported() {
  return typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
}

export function useAuth(notify) {
  const [authLoading, setAuthLoading] = useState(!isFallbackMode && !isTestMode);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (isTestMode) return true;
    if (!isFallbackMode) return false;
    return localStorage.getItem('astra_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('astra_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return DEFAULT_USER; }
    }
    return DEFAULT_USER;
  });
  const [hasPasskey, setHasPasskey] = useState(false);

  const [hasLoginPassword, setHasLoginPassword] = useState(() => {
    if (isTestMode) return false;
    if (isFallbackMode) return hasStoredLoginPassword();
    // Cloud mode: any authenticated email/password user already has a password.
    return true;
  });

  const passkeyReady = isPasskeySupported();

  // Refresh passkey registration status whenever the user changes.
  useEffect(() => {
    let cancelled = false;
    hasRegisteredPasskey().then(registered => {
      if (!cancelled) setHasPasskey(registered);
    });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const updateUser = useCallback((newDetails) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...newDetails };
      localStorage.setItem('astra_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Cloud mode: sync local user state from Supabase user_metadata when the
  // session changes.
  const syncUserFromSession = useCallback(async () => {
    if (isFallbackMode || isTestMode) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(getUserFromSession(user));
    }
  }, []);

  useEffect(() => {
    if (isFallbackMode || isTestMode) {
      setAuthLoading(false);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Supabase session check failed:', error.message);
        setIsLoggedIn(false);
      } else {
        const session = data?.session;
        setIsLoggedIn(Boolean(session));
        if (session?.user) setCurrentUser(getUserFromSession(session.user));
      }
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
      if (session?.user) setCurrentUser(getUserFromSession(session.user));
    });
    return () => {
      mounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    if (!isFallbackMode && !isTestMode) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data?.user) setCurrentUser(getUserFromSession(data.user));
      setIsLoggedIn(true);
      return;
    }
    // If a login password has been set in local mode, verify it before granting
    // a session. Until one is set, login stays permissive (back-compat).
    const stored = getStoredLoginPassword();
    if (stored) {
      const valid = await verifyPassword(password, stored);
      if (!valid) throw new Error('Invalid email or password.');
    } else {
      // First-time fallback login: seed a local password hash so the user can
      // also log in without a passkey later.
      const saltHash = await hashPassword(password);
      setStoredLoginPassword(saltHash);
    }
    setIsLoggedIn(true);
    localStorage.setItem('astra_logged_in', 'true');
    const namePart = email.split('@')[0];
    const username = namePart;
    const initial = username.charAt(0).toUpperCase();
    updateUser({ username, email, avatar: initial });
  }, [updateUser]);

  const setPassword = useCallback(async (newPassword) => {
    if (isTestMode) {
      return { ok: false, error: 'Password changes are disabled in test mode.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    if (isFallbackMode) {
      try {
        const saltHash = await hashPassword(newPassword);
        setStoredLoginPassword(saltHash);
        setHasLoginPassword(true);
        return { ok: true };
      } catch (err) {
        console.error('Failed to set login password:', err);
        return { ok: false, error: 'Failed to secure login password.' };
      }
    }
    // Cloud mode: set the user's Supabase Auth password.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    setHasLoginPassword(true);
    return { ok: true };
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (isTestMode) {
      return { ok: false, error: 'Password changes are disabled in test mode.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'New password must be at least 6 characters.' };
    }
    if (isFallbackMode) {
      const stored = getStoredLoginPassword();
      if (!stored) return { ok: false, error: 'No login password is set yet.' };
      const valid = await verifyPassword(currentPassword, stored);
      if (!valid) return { ok: false, error: 'Current password is incorrect.' };
      try {
        const saltHash = await hashPassword(newPassword);
        setStoredLoginPassword(saltHash);
        return { ok: true };
      } catch (err) {
        console.error('Failed to change login password:', err);
        return { ok: false, error: 'Failed to update login password.' };
      }
    }
    // Cloud mode: verify the current password by re-signing in, then update.
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;
    if (!email) return { ok: false, error: 'No authenticated user found.' };
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) return { ok: false, error: 'Current password is incorrect.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const passkeySetup = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    const result = await registerPasskey(userId);
    const key = await authenticatePasskey();
    const passphrase = generateVaultPassphrase();
    await wrapVaultPassphrase(passphrase, key);
    setHasPasskey(true);
    return result;
  }, []);

  const passkeyLogin = useCallback(async () => {
    const key = await authenticatePasskey();
    const passphrase = await unwrapVaultPassphrase(key);
    if (!passphrase) {
      throw new Error('Vault is not set up for this passkey. Please register first.');
    }

    if (isFallbackMode || isTestMode) {
      setIsLoggedIn(true);
      localStorage.setItem('astra_logged_in', 'true');
      const saved = localStorage.getItem('astra_user');
      let fallbackUser = DEFAULT_USER;
      if (saved) {
        try { fallbackUser = JSON.parse(saved); } catch { fallbackUser = DEFAULT_USER; }
      }
      updateUser({
        username: fallbackUser.username || DEFAULT_USER.username,
        email: fallbackUser.email || DEFAULT_USER.email,
        avatar: fallbackUser.avatar || DEFAULT_USER.avatar
      });
      return passphrase;
    }

    // Cloud mode: rehydrate the Supabase session. If the session expired, the
    // user still needs their password once to refresh; passkey alone cannot
    // mint a new Supabase token.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error(
        'Your Supabase session has expired. Sign in with your password first, then use the passkey.'
      );
    }
    setIsLoggedIn(true);
    setCurrentUser(getUserFromSession(user));
    return passphrase;
  }, [updateUser]);

  const logout = useCallback(async () => {
    if (!isFallbackMode && !isTestMode) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        notify('error', error.message);
        return;
      }
    }
    setIsLoggedIn(false);
    localStorage.removeItem('astra_logged_in');
    notify('success', 'Logged out successfully');
  }, [notify]);

  return {
    authLoading,
    isLoggedIn,
    currentUser,
    updateUser,
    syncUserFromSession,
    login,
    logout,
    hasLoginPassword,
    setPassword,
    changePassword,
    passkeyReady,
    hasPasskey,
    passkeySetup,
    passkeyLogin,
  };
}

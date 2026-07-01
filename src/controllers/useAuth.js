import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../models/dbClient.js';
import {
  hasRegisteredPasskey,
  registerPasskey,
  authenticatePasskey,
  generateVaultPassphrase,
  wrapVaultPassphrase,
  unwrapVaultPassphrase,
} from '../services/passkeyService.js';

function getUserFromSession(user) {
  const email = user?.email || '';
  const metadata = user?.user_metadata || {};
  const appMetadata = user?.app_metadata || {};
  const username = metadata.username || metadata.name || (email ? email.split('@')[0] : 'User');
  const avatar = metadata.avatar_url || metadata.avatar || username.charAt(0).toUpperCase();
  return {
    username,
    email,
    avatar,
    role: appMetadata.role || metadata.role || 'Administrator',
  };
}

function isPasskeySupported() {
  return typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
}

export function useAuth(notify) {
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    username: '',
    email: '',
    avatar: '?',
    role: 'Administrator',
  });
  const [hasPasskey, setHasPasskey] = useState(false);
  const [hasLoginPassword, setHasLoginPassword] = useState(true);

  const passkeyReady = isPasskeySupported();

  useEffect(() => {
    let cancelled = false;
    hasRegisteredPasskey().then(registered => {
      if (!cancelled) setHasPasskey(registered);
    });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const syncUserFromSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(getUserFromSession(user));
    }
  }, []);

  const updateUser = useCallback((newDetails) => {
    setCurrentUser(prev => ({ ...prev, ...newDetails }));
  }, []);

  useEffect(() => {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) setCurrentUser(getUserFromSession(data.user));
    setIsLoggedIn(true);
  }, []);

  const setPassword = useCallback(async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    setHasLoginPassword(true);
    return { ok: true };
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'New password must be at least 6 characters.' };
    }
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error(
        'Your Supabase session has expired. Sign in with your password first, then use the passkey.'
      );
    }
    setIsLoggedIn(true);
    setCurrentUser(getUserFromSession(user));
    return passphrase;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      notify('error', error.message);
      return;
    }
    setIsLoggedIn(false);
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

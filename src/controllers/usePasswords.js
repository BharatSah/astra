import { useState, useEffect, useCallback } from 'react';
import { fetchPasswords, createPassword, updatePassword, deletePassword } from '../models/passwordsModel.js';
import { fetchPlatforms } from '../models/platformsModel.js';
import { encryptSecret, decryptSecret, isEncrypted } from '../services/cryptoService.js';

// Controller: password vault. Owns platforms/passwords fetch, vault unlock/lock
// state + passphrase, per-entry decrypt caching, encrypt-on-save, and CRUD.
export function usePasswords({ notify }) {
  const [passwords, setPasswords] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [decryptedPasswords, setDecryptedPasswords] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [platformsData, passwordsData] = await Promise.all([
        fetchPlatforms(),
        fetchPasswords()
      ]);
      setPlatforms(platformsData);
      setPasswords(passwordsData);
    } catch (err) {
      console.error('Error fetching vault data:', err.message);
      notify('error', 'Failed to retrieve passwords or platforms');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { refresh(); }, [refresh]);

  const decryptEntry = useCallback(async (entry) => {
    if (!isEncrypted(entry.password)) return entry.password;
    const cached = decryptedPasswords[entry.id];
    if (cached !== undefined) return cached;
    try {
      const plain = await decryptSecret(entry.password, vaultPassphrase);
      setDecryptedPasswords(prev => ({ ...prev, [entry.id]: plain }));
      return plain;
    } catch {
      return '\u2022 decryption failed \u2022';
    }
  }, [decryptedPasswords, vaultPassphrase]);

  const unlockVault = useCallback((passphrase) => {
    setVaultPassphrase(passphrase);
    setVaultUnlocked(true);
  }, []);

  const lockVault = useCallback(() => {
    setVaultUnlocked(false);
    setVaultPassphrase('');
    setDecryptedPasswords({});
    setVisiblePasswords({});
  }, []);

  const savePassword = useCallback(async ({ editingId, platformName, username, password }) => {
    if (!platformName || !username || !password) {
      notify('warning', 'Please fill in all required fields');
      return false;
    }
    if (!vaultUnlocked || !vaultPassphrase) {
      notify('warning', 'Unlock the vault before saving credentials.');
      return false;
    }
    let storedPassword;
    try {
      storedPassword = await encryptSecret(password, vaultPassphrase);
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to encrypt credential');
      return false;
    }
    const payload = { platform_name: platformName, username, password: storedPassword };
    try {
      if (editingId) {
        await updatePassword(editingId, payload);
        setDecryptedPasswords(prev => ({ ...prev, [editingId]: password }));
        notify('success', 'Password updated successfully');
      } else {
        await createPassword(payload);
        notify('success', 'Password saved successfully');
      }
      await refresh();
      return true;
    } catch (err) {
      console.error(err);
      notify('error', 'Error saving credentials');
      return false;
    }
  }, [vaultUnlocked, vaultPassphrase, notify, refresh]);

  const removePassword = useCallback(async (id, platform) => {
    if (!confirm(`Are you sure you want to delete the credentials for ${platform}?`)) return false;
    try {
      await deletePassword(id);
      notify('success', 'Credentials deleted successfully');
      await refresh();
      return true;
    } catch (err) {
      console.error(err);
      notify('error', 'Error deleting credentials');
      return false;
    }
  }, [notify, refresh]);

  const toggleVisibility = useCallback(async (pw) => {
    const isVisible = visiblePasswords[pw.id];
    if (!isVisible) await decryptEntry(pw);
    setVisiblePasswords(prev => ({ ...prev, [pw.id]: !isVisible }));
  }, [visiblePasswords, decryptEntry]);

  return {
    passwords, platforms, loading,
    vaultUnlocked, vaultPassphrase, decryptedPasswords, visiblePasswords,
    refresh, unlockVault, lockVault, decryptEntry, savePassword, removePassword, toggleVisibility
  };
}
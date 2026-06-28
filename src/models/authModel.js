// Model: local-mode app login password and vault password. Stored as "salt:hash" records in localStorage:
// - astra_login_pw: for login authentication (up to the user)
// - astra_vault_pw: for vault encryption (requires current password verification to change)

const LOGIN_PASSWORD_KEY = 'astra_login_pw';
const VAULT_PASSWORD_KEY = 'astra_vault_pw';

export function getStoredLoginPassword() {
  return localStorage.getItem(LOGIN_PASSWORD_KEY) || null;
}

export function hasStoredLoginPassword() {
  return Boolean(getStoredLoginPassword());
}

export function clearStoredLoginPassword() {
  localStorage.removeItem(LOGIN_PASSWORD_KEY);
}

export function setStoredLoginPassword(saltHash) {
  localStorage.setItem(LOGIN_PASSWORD_KEY, saltHash);
}

export function getStoredVaultPassword() {
  return localStorage.getItem(VAULT_PASSWORD_KEY) || null;
}

export function hasStoredVaultPassword() {
  return Boolean(getStoredVaultPassword());
}

export function clearStoredVaultPassword() {
  localStorage.removeItem(VAULT_PASSWORD_KEY);
}

export function setStoredVaultPassword(saltHash) {
  localStorage.setItem(VAULT_PASSWORD_KEY, saltHash);
}

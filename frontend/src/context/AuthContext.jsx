import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { setSessionExpiredHandler } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'catalogue.session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { token, username, displayName, role }
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
  }, [clearSession]);

  // On boot, a token in localStorage might belong to a server-side cache entry that has
  // already expired (CacheService caps sessions at 6h) — confirm with `me` before trusting it.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setReady(true);
      return;
    }
    const parsed = JSON.parse(stored);
    authApi
      .me(parsed.token)
      .then((user) => setSession({ ...parsed, ...user }))
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setReady(true));
  }, []);

  async function login(username, password) {
    const result = await authApi.login(username, password);
    const next = { token: result.token, displayName: result.displayName, role: result.role, username };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }

  async function logout() {
    if (session) {
      try {
        await authApi.logout(session.token);
      } catch {
        // Already expired/invalid server-side — fine, we're clearing local state regardless.
      }
    }
    clearSession();
  }

  return (
    <AuthContext.Provider value={{ session, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

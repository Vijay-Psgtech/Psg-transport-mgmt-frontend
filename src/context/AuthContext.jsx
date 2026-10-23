import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAccessToken, setAuthFailureHandler } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true); // true until the first session check finishes

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // Restore the session on page load using the refresh cookie
  useEffect(() => {
    setAuthFailureHandler(clearSession);
    let cancelled = false;
    api
      .post('/auth/refresh')
      .then(({ data }) => {
        if (cancelled) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setInitializing(false); });
    return () => { cancelled = true; };
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
    setAccessToken(data.accessToken); // the server ended older sessions, so use the fresh token
    setUser(data.user);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await api.put('/auth/me', payload);
    setUser(data.user);
  }, []);

  const hasRole = useCallback((...roles) => !!user && roles.flat().includes(user.role), [user]);

  const value = useMemo(
    () => ({ user, initializing, isAuthenticated: !!user, login, logout, hasRole, changePassword, updateProfile }),
    [user, initializing, login, logout, hasRole, changePassword, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

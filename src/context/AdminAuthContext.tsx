import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AdminProfile, AdminRole } from '../types/admin';

const ADMIN_STORAGE_KEY = 'condopal_admin_session_v1';

export interface AdminAuthContextValue {
  isAuthenticated: boolean;
  admin: AdminProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  demoLogin: (role?: AdminRole) => void;
  logout: () => void;
  clearError: () => void;
}

const DEFAULT_DEMO_ADMIN: AdminProfile = {
  id: 'adm-00000000-0000-0000-0000-000000000001',
  email: 'admin@condopal.com',
  full_name: 'Lead Concierge Administrator',
  role: 'superadmin',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AdminProfile;
        if (parsed && parsed.is_active) {
          setAdmin(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading admin session from storage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Demo authentication logic for local / SPA operations
      if (email.trim().toLowerCase() === 'admin@condopal.com' && (password === 'condopal2026' || password === 'admin' || password === 'demo')) {
        const profile: AdminProfile = {
          ...DEFAULT_DEMO_ADMIN,
          email: email.trim().toLowerCase(),
        };
        setAdmin(profile);
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(profile));
        return true;
      }

      // Generic email check for demo convenience
      if (email.includes('@') && password.length >= 4) {
        const profile: AdminProfile = {
          id: `adm-${Date.now()}`,
          email: email.trim().toLowerCase(),
          full_name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          role: 'admin',
          avatar_url: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setAdmin(profile);
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(profile));
        return true;
      }

      setError('Invalid credentials. For instant demo access, use admin@condopal.com / condopal2026 or click "Demo Login".');
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = (role: AdminRole = 'superadmin') => {
    const profile: AdminProfile = {
      ...DEFAULT_DEMO_ADMIN,
      role,
    };
    setAdmin(profile);
    setError(null);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setAdmin(null);
    setError(null);
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const clearError = () => setError(null);

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: !!admin && admin.is_active,
        admin,
        isLoading,
        error,
        login,
        demoLogin,
        logout,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

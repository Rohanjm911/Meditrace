import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile } from '@meditrace/shared-types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('meditrace_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('meditrace_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on initial app mount only
  useEffect(() => {
    async function verifyInitialSession() {
      const existingToken = localStorage.getItem('meditrace_token');
      if (existingToken) {
        try {
          const res = await api.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('meditrace_user', JSON.stringify(res.user));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      } else {
        logout();
      }
      setIsLoading(false);
    }

    verifyInitialSession();

    const handleAuthExpired = () => logout();
    window.addEventListener('meditrace:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('meditrace:auth-expired', handleAuthExpired);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    if (!res || !res.token || !res.user) {
      throw new Error('Invalid server response during authentication');
    }
    localStorage.setItem('meditrace_token', res.token);
    localStorage.setItem('meditrace_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('meditrace_token');
    localStorage.removeItem('meditrace_user');
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

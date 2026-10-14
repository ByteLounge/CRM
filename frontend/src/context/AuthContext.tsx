import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface Organisation {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  organisation: Organisation | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const data = await api.auth.getMe();
      if (data?.user) {
        setUser(data.user);
        setOrganisation(data.currentOrganisation || { id: 'org_default_01', name: 'FlowCRM Store' });
      }
    } catch {
      // If no valid session and no token, user remains null (or can login via demo)
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If token exists or auto-demo login
    const token = localStorage.getItem('flowcrm_token');
    if (token) {
      checkAuth();
    } else {
      // Auto-initialize demo session if requested, or check
      checkAuth();
    }
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email);
      if (res?.token) {
        localStorage.setItem('flowcrm_token', res.token);
        if (res.organisation?.id) {
          localStorage.setItem('flowcrm_org_id', res.organisation.id);
        }
        setUser(res.user);
        setOrganisation(res.organisation);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('flowcrm_token');
    localStorage.removeItem('flowcrm_org_id');
    setUser(null);
    setOrganisation(null);
  };

  return (
    <AuthContext.Provider value={{ user, organisation, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

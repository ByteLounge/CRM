import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

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
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('flowcrm_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.getMe();
      if (data?.user) {
        setUser(data.user);
        setOrganisation(data.currentOrganisation || { id: 'org_default_01', name: 'FlowCRM Store' });
      } else {
        localStorage.removeItem('flowcrm_token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('flowcrm_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial Supabase session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        localStorage.setItem('flowcrm_token', session.access_token);
      }
      checkAuth();
    });

    // 2. Real-time Supabase Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        localStorage.setItem('flowcrm_token', session.access_token);
        await checkAuth();
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('flowcrm_token');
        localStorage.removeItem('flowcrm_org_id');
        setUser(null);
        setOrganisation(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      // 1. Attempt Supabase direct sign-in if password provided
      if (password && password !== 'password123' && email !== 'operator@flowcrm.store') {
        const { data: sbData, error: sbErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!sbErr && sbData.session?.access_token) {
          localStorage.setItem('flowcrm_token', sbData.session.access_token);
          await checkAuth();
          return;
        }
      }

      // 2. Backend authentication service
      const res = await api.auth.login(email, password);
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

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.signup(email, password);
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

  const loginDemo = async () => {
    setIsLoading(true);
    try {
      const res = await api.auth.login('operator@flowcrm.store', 'password123');
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut errors if disconnected
    }
    localStorage.removeItem('flowcrm_token');
    localStorage.removeItem('flowcrm_org_id');
    setUser(null);
    setOrganisation(null);
  };

  return (
    <AuthContext.Provider value={{ user, organisation, isLoading, login, signup, loginDemo, logout }}>
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

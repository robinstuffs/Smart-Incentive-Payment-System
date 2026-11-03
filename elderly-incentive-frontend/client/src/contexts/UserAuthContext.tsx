import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '@/lib/api';

// ── types ──────────────────────────────────────────────────────────────────────

interface AuthUser {
  id: number;
  surname: string;
  firstname: string;
  middlename?: string;
  username: string;
  email: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
  // Extended profile
  phone_number?: string;
  street_address?: string;
  city?: string;
  lga?: string;
  state?: string;
  country?: string;
  // Payment
  account_name?: string;
  account_number?: string;
  bank_id?: number;
  bank?: { id: number; name: string; abbreviation: string };
  is_profile_complete?: boolean;
}

interface UserAuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  isLoading: boolean;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (
    surname: string,
    firstname: string,
    middlename: string,
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ── context ────────────────────────────────────────────────────────────────────

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Fetch and store user profile
  const fetchUser = async () => {
    try {
      const response = await userAPI.getUserProfile();
      setUser(response.data);
    } catch {
      // Non-fatal — UI falls back to generic labels
      setUser(null);
    }
  };

  // On mount: restore session from localStorage, then fetch profile if token exists
  useEffect(() => {
    const token = localStorage.getItem('user_access_token');
    const role = localStorage.getItem('user_role');
    if (token && role === 'user') {
      setIsAuthenticated(true);
      setUserRole(role);
      fetchUser();
    }
    setIsLoading(false);
  }, []);

  const register = async (
    surname: string,
    firstname: string,
    middlename: string,
    username: string,
    email: string,
    password: string,
  ) => {
    await authAPI.register(surname, firstname, middlename, username, email, password);
  };

  const login = async (username: string, password: string) => {
    const response = await authAPI.login(username, password);
    const { access_token, user_role } = response.data;

    if (user_role !== 'user') {
      throw new Error('Only user accounts can access this system');
    }

    localStorage.setItem('user_access_token', access_token);
    localStorage.setItem('user_role', user_role);
    setIsAuthenticated(true);
    setUserRole(user_role);

    // Fetch profile immediately after login so user data is ready
    await fetchUser();
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user_access_token');
      localStorage.removeItem('user_role');
      setIsAuthenticated(false);
      setUserRole(null);
      setUser(null);
    }
  };

  const checkAuth = async () => {
    try {
      await authAPI.protected();
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('user_access_token');
      localStorage.removeItem('user_role');
      setIsAuthenticated(false);
      setUserRole(null);
      setUser(null);
      throw error;
    }
  };

  // Call this after updating the profile so the context stays in sync
  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <UserAuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        isLoading,
        user,
        login,
        register,
        logout,
        checkAuth,
        refreshUser,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within UserAuthProvider');
  }
  return context;
};
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'faculty';
  faculty?: {
    faculty_id: string;
    employee_id: string;
    name: string;
    department: 'CSA' | 'CSE' | 'AI & ML';
    designation: string;
    skills: string;
    email: string;
  } | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateFacultyProfile: (facultyData: NonNullable<User['faculty']>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (currentToken: string) => {
    try {
      const data = await apiFetch<{ user: User }>('/auth/profile', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setUser(data.user);
    } catch (err) {
      console.error('Failed to fetch user profile, logging out...', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const updateFacultyProfile = (facultyData: NonNullable<User['faculty']>) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        faculty: facultyData
      };
    });
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, updateFacultyProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

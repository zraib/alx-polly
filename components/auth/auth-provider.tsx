"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Check for existing session/token on mount
    const checkAuth = async () => {
      try {
        // Simulate checking for existing session
        const token = localStorage.getItem('auth-token');
        if (token) {
          // TODO: Validate token and get user data
          console.log('Found existing token:', token);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual login API call
      console.log('Login attempt:', { email, password });
      
      // Simulate successful login
      const mockUser: User = {
        id: '1',
        name: 'John Doe',
        email: email
      };
      
      setUser(mockUser);
      localStorage.setItem('auth-token', 'mock-jwt-token');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration API call
      console.log('Registration attempt:', { name, email, password });
      
      // Simulate successful registration
      const mockUser: User = {
        id: '1',
        name: name,
        email: email
      };
      
      setUser(mockUser);
      localStorage.setItem('auth-token', 'mock-jwt-token');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-token');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
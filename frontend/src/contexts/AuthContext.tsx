import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL, defaultFetchOptions, handleResponse } from '@/config/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  repos?: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description?: string;
    visibility: string;
    owner: {
      avatar_url: string;
    };
  }[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  getAuthToken: () => string | null;
}

interface StoredSession {
  token: string;
  user: User;
  expiresAt: number;
}

interface AuthResponse {
  user: User;
  token: string;
}

const SESSION_KEY = 'bella_session';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds (matches backend)

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginInProgress, setLoginInProgress] = useState(false);

  const saveSession = (token: string, userData: User) => {
    const session: StoredSession = {
      token,
      user: userData,
      expiresAt: Date.now() + SESSION_DURATION
    };
    
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  // Get current session data including token
  const getSession = (): StoredSession | null => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      try {
        const session = getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        // Check if session has expired
        if (Date.now() > session.expiresAt) {
          clearSession();
          setLoading(false);
          return;
        }

        // If session is still valid but close to expiry, extend it
        if (session.expiresAt - Date.now() < SESSION_DURATION / 2) {
          saveSession(session.token, session.user);
        }

        setUser(session.user);
      } catch (error) {
        console.error('Error checking auth:', error);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up periodic session check
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  const login = async (code: string) => {
    if (loginInProgress) {
      console.log('Login already in progress');
      return;
    }

    try {
      setLoginInProgress(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/github`, {
        ...defaultFetchOptions,
        method: 'POST',
        body: JSON.stringify({ code })
      });

      const data = await handleResponse<AuthResponse>(response);
      
      // Save session with validated data
      saveSession(data.token, data.user);
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      clearSession();
      throw error;
    } finally {
      setLoginInProgress(false);
    }
  };

  const logout = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          ...defaultFetchOptions,
          method: 'POST',
          headers: {
            ...defaultFetchOptions.headers,
            Authorization: `Bearer ${token}`
          } as HeadersInit
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearSession();
    }
  };

  // Get the current auth token
  const getAuthToken = (): string | null => {
    const session = getSession();
    return session?.token || null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getAuthToken }}>
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
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';


interface User {
  username: string;
  email?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
}

function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Load token and user on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = decodeJWT(token);
      console.log('JWT Payload: ', payload);
      if (payload) {
        setIsLoggedIn(true);
        setUser({
          username: payload.username || `User_${payload.user_id}` || payload.sub || 'User',
          email: payload.email
        });
      } else {
        // Clear invalid token
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsLoggedIn(false);
        setUser(null);
      }
    }
  }, []);

  const login = (token: string, refreshToken: string) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    const payload = decodeJWT(token);
    if (payload) {
      setIsLoggedIn(true);
      setUser({
        username: payload.username || `User_${payload.user_id}` || payload.sub || 'User',
        email: payload.email
      });
    } else {
      // Fallback if decode fails
      setIsLoggedIn(true);
      setUser({ username: 'User' });
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
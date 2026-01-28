'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 기본 사용자 정보 (실제로는 DB에서 관리)
const DEFAULT_USER = {
  username: 'nano',
  password: 'password',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storedPassword, setStoredPassword] = useState(DEFAULT_USER.password);

  useEffect(() => {
    // 페이지 로드 시 localStorage에서 인증 상태 확인
    const savedAuth = localStorage.getItem('auth');
    const savedPassword = localStorage.getItem('userPassword');
    
    if (savedPassword) {
      setStoredPassword(savedPassword);
    }
    
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUsername(authData.username);
    }
    setIsLoading(false);
  }, []);

  const login = async (inputUsername: string, inputPassword: string): Promise<boolean> => {
    // 저장된 비밀번호 확인 (localStorage에서 변경된 비밀번호가 있으면 사용)
    const currentPassword = localStorage.getItem('userPassword') || DEFAULT_USER.password;
    
    if (inputUsername === DEFAULT_USER.username && inputPassword === currentPassword) {
      setIsAuthenticated(true);
      setUsername(inputUsername);
      localStorage.setItem('auth', JSON.stringify({ username: inputUsername }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem('auth');
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const savedPassword = localStorage.getItem('userPassword') || DEFAULT_USER.password;
    
    if (currentPassword === savedPassword) {
      localStorage.setItem('userPassword', newPassword);
      setStoredPassword(newPassword);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout, changePassword, isLoading }}>
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

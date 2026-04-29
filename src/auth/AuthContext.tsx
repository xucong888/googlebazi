import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { verifyToken, logout as apiLogout, getCurrentUser, type ApiUser } from '../api';

interface AuthContextType {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(getCurrentUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    verifyToken().then(u => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

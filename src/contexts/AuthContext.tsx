import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuthData,
  storeAuthData,
  clearAuthData,
} from '../utils/authStorage';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: number | null;
  phoneNumber: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (authData: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    phoneNumber: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth data when the app starts
    const initializeAuth = async () => {
      try {
        const storedAuth = await getAuthData();
        if (storedAuth.accessToken && storedAuth.userId) {
          setIsAuthenticated(true);
          setUserId(storedAuth.userId);
          setPhoneNumber(storedAuth.phoneNumber);
          setAccessToken(storedAuth.accessToken);
          setRefreshToken(storedAuth.refreshToken);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (authData: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    phoneNumber: string;
  }) => {
    await storeAuthData(authData);
    setIsAuthenticated(true);
    setUserId(authData.userId);
    setPhoneNumber(authData.phoneNumber);
    setAccessToken(authData.accessToken);
    setRefreshToken(authData.refreshToken);
  };

  const logout = async () => {
    await clearAuthData();
    setIsAuthenticated(false);
    setUserId(null);
    setPhoneNumber(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        userId,
        phoneNumber,
        accessToken,
        refreshToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

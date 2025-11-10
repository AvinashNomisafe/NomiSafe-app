import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuthData,
  storeAuthData,
  clearAuthData,
} from '../utils/authStorage';
import { authApi } from '../services/auth';
import { useDispatch } from 'react-redux';
import { setAuthState, setAadhaarVerified } from '../store/authSlice';

interface UserType {
  userId: number;
  phoneNumber: string;
  isAadhaarVerified: boolean;
}

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserType | null;
  userId: number | null;
  phoneNumber: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (authData: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    phoneNumber: string;
    user?: UserType;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
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

          // Update Redux state
          dispatch(
            setAuthState({
              isAuthenticated: true,
              accessToken: storedAuth.accessToken,
              refreshToken: storedAuth.refreshToken,
              userId: storedAuth.userId,
              phoneNumber: storedAuth.phoneNumber,
              isAadhaarVerified: storedAuth.user?.isAadhaarVerified || false,
            }),
          );
          // ensure axios authApi has the Authorization header set so subsequent
          // requests from the app include the token immediately
          if (storedAuth.accessToken) {
            authApi.defaults.headers.Authorization = `Bearer ${storedAuth.accessToken}`;
          }

          if (storedAuth.user) {
            setUser(storedAuth.user);
          } else {
            setUser({
              userId: storedAuth.userId,
              phoneNumber: storedAuth.phoneNumber || '',
              isAadhaarVerified: false,
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Setup axios interceptor to listen for auth failures and auto-logout
    const interceptor = authApi.interceptors.response.use(
      response => response,
      async error => {
        // If we get a 401 after token refresh attempts, logout
        if (error.config?._retry && error.response?.status === 401) {
          console.log('Token refresh failed, logging out...');
          await logout();
        }
        return Promise.reject(error);
      },
    );

    // Cleanup interceptor on unmount
    return () => {
      authApi.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (authData: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    phoneNumber: string;
    user?: UserType;
  }) => {
    await storeAuthData(authData);
    setIsAuthenticated(true);
    setUserId(authData.userId);
    setPhoneNumber(authData.phoneNumber);
    setAccessToken(authData.accessToken);
    setRefreshToken(authData.refreshToken);
    // set axios default header so other services pick it up immediately
    if (authData.accessToken) {
      authApi.defaults.headers.Authorization = `Bearer ${authData.accessToken}`;
    }
    if (authData.user) {
      setUser(authData.user);
    } else {
      setUser({
        userId: authData.userId,
        phoneNumber: authData.phoneNumber,
        isAadhaarVerified: false,
      });
    }
  };

  const logout = async () => {
    await clearAuthData();
    setIsAuthenticated(false);
    setUserId(null);
    setPhoneNumber(null);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    // Clear Redux state
    dispatch(
      setAuthState({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        userId: null,
        phoneNumber: null,
        isAadhaarVerified: false,
      }),
    );
    // clear axios default header
    delete authApi.defaults.headers.Authorization;
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
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

import axios from 'axios';
import { OTPRequestResponse, OTPVerifyResponse } from '../types/auth';
import {
  getAuthData,
  storeAuthData,
  clearAuthData,
} from '../utils/authStorage';
import {
  API_BASE_URL,
  API_TIMEOUT,
  ENVIRONMENT,
  logAPICall,
} from '../config/api';

console.log(`🚀 API Environment: ${ENVIRONMENT}`);
console.log(`🌐 API Base URL: ${API_BASE_URL}`);

// Base axios instance for non-authenticated requests
export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT,
});

// Public API instance: used for endpoints that must be called without
// sending Authorization header (eg. OTP request/verify). This avoids
// causing authentication errors if the client has an expired/malformed token.
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT,
});

// Add a request interceptor to include the access token
authApi.interceptors.request.use(async config => {
  try {
    const authData = await getAuthData();
    if (authData.accessToken) {
      config.headers.Authorization = `Bearer ${authData.accessToken}`;
    }
    return config;
  } catch (error) {
    return config;
  }
});

// Token refresh function
export const refreshAccessToken = async (
  refreshToken: string,
): Promise<{ access: string; refresh: string } | null> => {
  try {
    const response = await publicApi.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return {
      access: response.data.access,
      refresh: response.data.refresh || refreshToken, // Some implementations return new refresh token
    };
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
};

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Add response interceptor to handle token refresh
authApi.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, wait for the new token
        return new Promise(resolve => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(authApi(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authData = await getAuthData();
        if (!authData.refreshToken) {
          // No refresh token available, logout
          await clearAuthData();
          isRefreshing = false;
          return Promise.reject(error);
        }

        const tokens = await refreshAccessToken(authData.refreshToken);

        if (!tokens) {
          // Refresh failed, logout
          await clearAuthData();
          isRefreshing = false;
          return Promise.reject(error);
        }

        // Save new tokens
        await storeAuthData({
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          userId: authData.userId!,
          phoneNumber: authData.phoneNumber!,
          user: authData.user,
        });

        // Update the default authorization header
        authApi.defaults.headers.Authorization = `Bearer ${tokens.access}`;
        originalRequest.headers.Authorization = `Bearer ${tokens.access}`;

        // Notify all subscribers
        onTokenRefreshed(tokens.access);
        isRefreshing = false;

        // Retry the original request
        return authApi(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        await clearAuthData();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Create an authenticated axios instance
export const createAuthenticatedApi = (accessToken: string) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    timeout: 10000,
  });
};

export const sendOTP = async (phoneNumber: string): Promise<boolean> => {
  try {
    const response = await publicApi.post<OTPRequestResponse>(
      '/auth/otp/request/',
      {
        phone_number: phoneNumber,
      },
    );
    return response.status === 202;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to send OTP');
    }
    throw error;
  }
};

export const verifyOTP = async (
  phoneNumber: string,
  otp: string,
): Promise<OTPVerifyResponse> => {
  try {
    const response = await publicApi.post<OTPVerifyResponse>(
      '/auth/otp/verify/',
      {
        phone_number: phoneNumber,
        otp,
      },
    );

    // Only store auth data if we get a successful response with tokens
    if (response.data && response.data.access && response.data.refresh) {
      await storeAuthData({
        accessToken: response.data.access,
        refreshToken: response.data.refresh,
        userId: response.data.id,
        phoneNumber: response.data.phone_number,
      });
    }

    return response.data;
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        'Invalid or expired OTP. Please try again.';
      throw new Error(errorMessage);
    }
    throw new Error('Failed to verify OTP. Please try again.');
  }
};

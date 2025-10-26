import axios from 'axios';
import { OTPRequestResponse, OTPVerifyResponse } from '../types/auth';
import { getAuthData } from '../utils/authStorage';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator, localhost for iOS
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',
  ios: 'http://127.0.0.1:8000/api',
  default: 'http://127.0.0.1:8000/api',
});

// Base axios instance for non-authenticated requests
export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
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
    const response = await authApi.post<OTPRequestResponse>(
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

import { storeAuthData } from '../utils/authStorage';

export const verifyOTP = async (
  phoneNumber: string,
  otp: string,
): Promise<OTPVerifyResponse> => {
  try {
    const response = await authApi.post<OTPVerifyResponse>(
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

import axios from 'axios';
import { OTPRequestResponse, OTPVerifyResponse } from '../types/auth';

import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator, localhost for iOS
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',
  ios: 'http://127.0.0.1:8000/api',
  default: 'http://127.0.0.1:8000/api',
});

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

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
    return response.data;
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to verify OTP');
    }
    throw error;
  }
};

/**
 * API Configuration
 *
 * Easy switching between Emulator, Physical Device, and Production
 *
 * TO SWITCH ENVIRONMENTS:
 * 1. Change DEVICE_TYPE below to 'EMULATOR', 'PHYSICAL_DEVICE', or 'PRODUCTION'
 * 2. For PHYSICAL_DEVICE: Update MAC_IP with your current Mac IP (run: ipconfig getifaddr en0)
 * 3. Reload the app (r r in Metro)
 */

import { Platform } from 'react-native';

// ============================================
// CHANGE THIS TO SWITCH ENVIRONMENTS
// ============================================
export type DeviceType = 'EMULATOR' | 'PHYSICAL_DEVICE' | 'PRODUCTION';
export const DEVICE_TYPE: DeviceType = 'PRODUCTION'; // <-- CHANGE THIS

// Update this with your Mac's local IP when using physical device
// Find it with: ipconfig getifaddr en0 (Mac) or ipconfig (Windows)
export const MAC_IP = '192.168.1.19';
// ============================================

const getBaseURL = (): string => {
  if (DEVICE_TYPE === 'PRODUCTION') {
    return 'http://15.207.247.24/api';
  }

  if (DEVICE_TYPE === 'EMULATOR') {
    // Android Emulator uses 10.0.2.2 to access host machine
    // iOS Simulator uses localhost
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:8000/api'
      : 'http://localhost:8000/api';
  }

  // PHYSICAL_DEVICE
  return `http://${MAC_IP}:8000/api`;
};

export const API_BASE_URL = getBaseURL();
export const API_TIMEOUT = DEVICE_TYPE === 'PRODUCTION' ? 30000 : 60000; // Longer timeout for local dev (file uploads)
// Dedicated (long) timeout for heavy policy uploads + AI extraction (Postman observed ~170s)
export const UPLOAD_TIMEOUT_MS = DEVICE_TYPE === 'PRODUCTION' ? 180000 : 300000; // 3-5 min

// Log current configuration on app start
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📡 API CONFIGURATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Device Type: ${DEVICE_TYPE}`);
console.log(`Platform: ${Platform.OS}`);
console.log(`Base URL: ${API_BASE_URL}`);
console.log(`Timeout: ${API_TIMEOUT}ms`);
console.log(`Upload Timeout: ${UPLOAD_TIMEOUT_MS}ms`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

export type Environment = 'development' | 'production';
export const ENVIRONMENT: Environment = __DEV__ ? 'development' : 'production';

// Logging helper
export const logAPICall = (endpoint: string, method: string) => {
  console.log(`[${DEVICE_TYPE}] ${method} ${API_BASE_URL}${endpoint}`);
};

/**
 * API Configuration
 *
 * Automatically uses correct API based on __DEV__ flag:
 * - Development: Local backend on your Mac
 * - Production: EC2 production server
 */

export type Environment = 'development' | 'production';

// Automatically detect environment based on React Native __DEV__ flag
export const ENVIRONMENT: Environment = __DEV__ ? 'development' : 'production';

export const API_CONFIG = {
  development: {
    baseURL: 'http://192.168.1.105:8000/api', // Your local Mac IP
    timeout: 10000,
  },
  production: {
    baseURL: 'http://51.20.84.242/api', // EC2 production server
    timeout: 15000,
  },
};

// Get current config based on environment
export const getCurrentConfig = () => API_CONFIG[ENVIRONMENT];

export const API_BASE_URL = getCurrentConfig().baseURL;
export const API_TIMEOUT = getCurrentConfig().timeout;

// Logging helper
export const logAPICall = (
  endpoint: string,
  method: string,
  env: Environment,
) => {
  console.log(`[${env.toUpperCase()}] ${method} ${API_BASE_URL}${endpoint}`);
};

/**
 * API Testing Utility
 *
 * Quick functions to test your production API endpoints
 */

import { publicApi, authApi } from './auth';
import { API_BASE_URL, ENVIRONMENT } from '../config/api';

export interface APIHealthCheck {
  environment: string;
  baseURL: string;
  endpoints: {
    [key: string]: {
      status: 'success' | 'error';
      statusCode?: number;
      message?: string;
      responseTime?: number;
    };
  };
}

/**
 * Test if the API server is reachable
 */
export const testAPIConnection = async (): Promise<APIHealthCheck> => {
  const result: APIHealthCheck = {
    environment: ENVIRONMENT,
    baseURL: API_BASE_URL,
    endpoints: {},
  };

  // Test 1: Send OTP endpoint (POST)
  try {
    const startTime = Date.now();
    await publicApi.post('/auth/otp/request/', { phone: '+919999999999' });
    result.endpoints['auth/otp/request'] = {
      status: 'success',
      statusCode: 200,
      responseTime: Date.now() - startTime,
    };
  } catch (error: any) {
    result.endpoints['auth/otp/request'] = {
      status: error.response ? 'success' : 'error',
      statusCode: error.response?.status,
      message: error.message,
    };
  }

  // Test 2: Policies list endpoint (GET) - will fail with 401 if not authenticated
  try {
    const startTime = Date.now();
    await authApi.get('/policies/');
    result.endpoints['policies'] = {
      status: 'success',
      statusCode: 200,
      responseTime: Date.now() - startTime,
    };
  } catch (error: any) {
    result.endpoints['policies'] = {
      status: error.response ? 'success' : 'error',
      statusCode: error.response?.status,
      message:
        error.response?.status === 401
          ? 'Requires authentication'
          : error.message,
    };
  }

  // Test 3: Simple base URL check
  try {
    const startTime = Date.now();
    const response = await publicApi.get('/');
    result.endpoints['base'] = {
      status: 'success',
      statusCode: response.status,
      responseTime: Date.now() - startTime,
    };
  } catch (error: any) {
    result.endpoints['base'] = {
      status: error.response ? 'success' : 'error',
      statusCode: error.response?.status,
      message: error.message,
    };
  }

  return result;
};

/**
 * Pretty print API test results
 */
export const printAPITestResults = (results: APIHealthCheck) => {
  console.log('\n========================================');
  console.log('🔍 API HEALTH CHECK RESULTS');
  console.log('========================================');
  console.log(`Environment: ${results.environment.toUpperCase()}`);
  console.log(`Base URL: ${results.baseURL}`);
  console.log('----------------------------------------');

  Object.entries(results.endpoints).forEach(([endpoint, result]) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    const status = result.statusCode ? `[${result.statusCode}]` : '';
    const time = result.responseTime ? `(${result.responseTime}ms)` : '';

    console.log(`${icon} ${endpoint} ${status} ${time}`);
    if (result.message) {
      console.log(`   └─ ${result.message}`);
    }
  });

  console.log('========================================\n');
};

/**
 * Quick test function - call this from your screen
 */
export const runAPITest = async () => {
  console.log('🚀 Starting API connection test...');
  const results = await testAPIConnection();
  printAPITestResults(results);
  return results;
};

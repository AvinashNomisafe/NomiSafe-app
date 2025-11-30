import axios from 'axios';
import { authApi } from './auth';
import { API_BASE_URL, UPLOAD_TIMEOUT_MS } from '../config/api';

export interface Policy {
  id: number;
  name: string;
  document_url: string;
  benefits: string;
  uploaded_at: string;
}

export interface PolicyNominee {
  name: string;
  relationship: string;
  allocation_percentage: number;
}

export interface PolicyCoverage {
  sum_assured: number;
  premium_amount: number;
  premium_frequency: string;
  issue_date: string | null;
  start_date: string | null;
  end_date: string | null;
  maturity_date: string | null;
}

export interface ExtractedPolicyData {
  insurance_type: string;
  policy_number: string;
  insurer_name: string;
  coverage: PolicyCoverage;
  nominees?: PolicyNominee[];
  benefits?: any[];
  exclusions?: any[];
  health_details?: any;
  covered_members?: any[];
}

export interface PolicyUploadResponse {
  id: number;
  name: string;
  uploaded_at: string;
  extracted_data: ExtractedPolicyData;
  message: string;
}

export const uploadPolicy = async (
  name: string,
  document: {
    uri: string;
    type: string;
    name: string;
  },
): Promise<PolicyUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('document', {
      uri: document.uri,
      type: document.type || 'application/pdf',
      name: document.name,
    } as any);
    // Use a dedicated axios instance with extended timeout for large PDF + AI processing
    const uploadApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: UPLOAD_TIMEOUT_MS,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Copy auth header if present
    const authHeader = (authApi.defaults.headers as any)?.Authorization;
    if (authHeader) {
      uploadApi.defaults.headers.Authorization = authHeader;
    }

    const startedAt = Date.now();
    console.log('[Policy Upload] Started', {
      name,
      file: document.name,
      timeout: UPLOAD_TIMEOUT_MS,
    });

    const response = await uploadApi.post('/policies/upload/', formData, {
      onUploadProgress: prog => {
        if (prog.total) {
          const pct = Math.round((prog.loaded / prog.total) * 100);
          if (pct % 10 === 0) {
            console.log(`[Policy Upload] Progress: ${pct}%`);
          }
        }
      },
    });

    console.log('[Policy Upload] Completed', {
      elapsedMs: Date.now() - startedAt,
      policyId: response.data?.id,
    });

    return response.data;
  } catch (error) {
    console.error('Failed to upload policy:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(
          'Upload timed out. The file + AI extraction took too long. Consider reducing PDF size or retrying.',
        );
      }
    }
    throw error;
  }
};

export const verifyPolicy = async (
  policyId: number,
  verifiedData: ExtractedPolicyData,
): Promise<any> => {
  try {
    const response = await authApi.post(
      `/policies/${policyId}/verify/`,
      verifiedData,
    );

    return response.data;
  } catch (error) {
    console.error('Failed to verify policy:', error);
    throw error;
  }
};

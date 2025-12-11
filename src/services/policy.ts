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

export interface PolicyListItem {
  id: number;
  name: string;
  insurance_type: string;
  policy_number: string;
  insurer_name: string;
  sum_assured: string;
  premium_amount: string;
  end_date: string | null;
  is_expired: boolean;
  uploaded_at: string;
  ai_extraction_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  is_verified_by_user: boolean;
}

export interface PolicyListResponse {
  health: PolicyListItem[];
  life: PolicyListItem[];
  unprocessed: PolicyListItem[];
}

export interface CoveredMember {
  name: string;
  relationship: string;
  date_of_birth: string | null;
  sum_insured: number | null;
}

export interface HealthInsuranceDetails {
  policy_type: string | null;
  room_rent_limit: number | null;
  copay_percentage: number | null;
  deductible_amount: number | null;
  restoration_benefit: boolean;
  no_claim_bonus: number | null;
  waiting_period_days: number | null;
  covered_members: CoveredMember[];
}

export interface PolicyBenefit {
  benefit_name: string;
  benefit_amount: number | null;
  description: string | null;
}

export interface PolicyExclusion {
  exclusion_type: string;
  description: string;
}

export interface PolicyDetail {
  id: number;
  name: string;
  insurance_type: string;
  policy_number: string;
  insurer_name: string;
  uploaded_at: string;
  coverage: PolicyCoverage;
  nominees: PolicyNominee[];
  benefits: PolicyBenefit[];
  exclusions: PolicyExclusion[];
  health_details: HealthInsuranceDetails | null;
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
  ai_extraction_status: string;
  message: string;
}

export interface ExtractionStatusResponse {
  policy_id: number;
  ai_extraction_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  ai_extracted_at: string | null;
  ai_extraction_error: string | null;
  extracted_data?: ExtractedPolicyData;
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

    // Use regular upload timeout now (AI happens in background)
    const response = await authApi.post('/policies/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 second timeout for upload only
    });

    console.log('[Policy Upload] Completed', {
      policyId: response.data?.id,
      status: response.data?.ai_extraction_status,
    });

    return response.data;
  } catch (error) {
    console.error('Failed to upload policy:', error);
    throw error;
  }
};

export const getExtractionStatus = async (
  policyId: number,
): Promise<ExtractionStatusResponse> => {
  try {
    const response = await authApi.get(
      `/policies/${policyId}/extraction-status/`,
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get extraction status:', error);
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

export const getPolicies = async (
  insuranceType?: 'LIFE' | 'HEALTH',
): Promise<PolicyListResponse> => {
  try {
    const params = insuranceType ? { insurance_type: insuranceType } : {};
    const response = await authApi.get('/policies/', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch policies:', error);
    throw error;
  }
};

export const getPolicyDetail = async (
  policyId: number,
): Promise<PolicyDetail> => {
  try {
    const response = await authApi.get(`/policies/${policyId}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch policy detail:', error);
    throw error;
  }
};

// Dashboard Stats Types
export interface InsuranceStats {
  total_policies: number;
  total_sum_assured: number;
  total_premium: number;
  active_policies: number;
  expired_policies: number;
  total_maturity_amount: number;
}

export interface RenewalItem {
  id: number;
  name: string;
  insurance_type: string;
  insurer_name: string;
  end_date: string;
  days_remaining: number;
  premium_amount: number;
}

export interface RecentPolicy {
  id: number;
  name: string;
  insurance_type: string;
  insurer_name: string;
  uploaded_at: string;
  sum_assured: number;
}

export interface ProfileCompletion {
  completed: number;
  total: number;
  percentage: number;
}

export interface DashboardStats {
  summary: {
    total_policies: number;
    life_insurance_count: number;
    health_insurance_count: number;
    total_monthly_premium: number;
  };
  life_insurance: InsuranceStats;
  health_insurance: InsuranceStats;
  upcoming_renewals: RenewalItem[];
  recent_policies: RecentPolicy[];
  profile_completion: ProfileCompletion;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await authApi.get('/policies/dashboard/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    throw error;
  }
};

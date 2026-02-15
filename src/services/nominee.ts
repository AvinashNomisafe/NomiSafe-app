import { authApi } from './auth';

export interface AppNominee {
  id: number;
  name: string;
  relationship: string | null;
  contact_details: string | null;
  id_proof_type: string | null;
  aadhaar_number: string | null;
  id_proof_file_url: string | null;
}

export interface AppNomineeResponse {
  nominee: AppNominee | null;
}

export interface SaveNomineePayload {
  name: string;
  relationship?: string;
  contact_details?: string;
  id_proof_type?: string;
  aadhaar_number?: string;
  id_proof_file?: {
    uri: string;
    type: string;
    name: string;
  } | null;
}

export const getNominee = async (): Promise<AppNominee | null> => {
  const response = await authApi.get<AppNomineeResponse>('/nominee/');
  return response.data.nominee || null;
};

export const saveNominee = async (
  payload: SaveNomineePayload,
): Promise<AppNominee> => {
  const formData = new FormData();
  formData.append('name', payload.name);
  if (payload.relationship) {
    formData.append('relationship', payload.relationship);
  }
  if (payload.contact_details) {
    formData.append('contact_details', payload.contact_details);
  }
  if (payload.id_proof_type) {
    formData.append('id_proof_type', payload.id_proof_type);
  }
  if (payload.aadhaar_number) {
    formData.append('aadhaar_number', payload.aadhaar_number);
  }
  if (payload.id_proof_file) {
    formData.append('id_proof_file', payload.id_proof_file as any);
  }

  const response = await authApi.post<AppNomineeResponse>(
    '/nominee/',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  if (!response.data.nominee) {
    throw new Error('Failed to save nominee');
  }

  return response.data.nominee;
};

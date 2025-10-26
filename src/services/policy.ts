import { authApi } from './auth';

export interface PolicyUploadResponse {
  id: number;
  name: string;
  document: string;
  benefits: string;
  uploaded_at: string;
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
    formData.append('benefits', '');
    formData.append('document', {
      uri: document.uri,
      type: document.type || 'application/pdf',
      name: document.name,
    });

    const response = await authApi.post('/policies/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to upload policy:', error);
    throw error;
  }
};

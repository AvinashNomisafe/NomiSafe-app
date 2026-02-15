import { authApi } from './auth';

export interface PropertyItem {
  id: number;
  name: string;
  document_url: string | null;
  uploaded_at: string;
}

export interface PropertyListResponse {
  properties: PropertyItem[];
}

export interface PropertyCreateResponse {
  property: PropertyItem;
}

export interface PropertyDownloadResponse {
  url: string;
}

export const getProperties = async (): Promise<PropertyItem[]> => {
  const response = await authApi.get<PropertyListResponse>('/properties/');
  return response.data.properties || [];
};

export const uploadProperty = async (
  name: string,
  file: { uri: string; type: string; name: string },
): Promise<PropertyItem> => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('document', file as any);

  const response = await authApi.post<PropertyCreateResponse>(
    '/properties/',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return response.data.property;
};

export const getPropertyDownloadUrl = async (
  propertyId: number,
): Promise<string> => {
  const response = await authApi.get<PropertyDownloadResponse>(
    `/properties/${propertyId}/download/`,
  );
  return response.data.url;
};

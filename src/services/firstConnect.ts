import { authApi } from './auth';

export interface FirstConnectItem {
  id: number;
  name: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface FirstConnectListResponse {
  first_connects: FirstConnectItem[];
  count: number;
  max_allowed: number;
  remaining: number;
}

export interface FirstConnectCreateResponse {
  first_connect: FirstConnectItem;
  count: number;
  remaining: number;
}

export interface FirstConnectDeleteResponse {
  message: string;
  count: number;
  remaining: number;
}

export const getFirstConnects = async (): Promise<FirstConnectListResponse> => {
  const response = await authApi.get<FirstConnectListResponse>(
    '/first-connects/',
  );
  return response.data;
};

export const createFirstConnect = async (
  name: string,
  phone_number: string,
): Promise<FirstConnectCreateResponse> => {
  const response = await authApi.post<FirstConnectCreateResponse>(
    '/first-connects/',
    { name, phone_number },
  );
  return response.data;
};

export const updateFirstConnect = async (
  id: number,
  name: string,
  phone_number: string,
): Promise<{ first_connect: FirstConnectItem }> => {
  const response = await authApi.put<{ first_connect: FirstConnectItem }>(
    `/first-connects/${id}/`,
    { name, phone_number },
  );
  return response.data;
};

export const deleteFirstConnect = async (
  id: number,
): Promise<FirstConnectDeleteResponse> => {
  const response = await authApi.delete<FirstConnectDeleteResponse>(
    `/first-connects/${id}/`,
  );
  return response.data;
};

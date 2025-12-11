import { authApi } from './auth';

export interface UserProfileData {
  name: string | null;
  date_of_birth: string | null;
  alternate_phone: string | null;
}

export interface UserProfile {
  id: number;
  phone_number: string;
  email: string | null;
  is_aadhaar_verified: boolean;
  profile: UserProfileData;
}

export interface ProfileUpdateData {
  email?: string;
  name?: string;
  date_of_birth?: string;
  alternate_phone?: string;
}

export const getProfile = async (): Promise<UserProfile> => {
  try {
    const response = await authApi.get('/profile/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw error;
  }
};

export const updateProfile = async (
  data: ProfileUpdateData,
): Promise<UserProfile> => {
  try {
    const response = await authApi.patch('/profile/', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

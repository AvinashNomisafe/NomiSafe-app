import { authApi } from './auth';

export interface TutorialItem {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  thumbnail_url: string;
  youtube_url: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TutorialListResponse {
  tutorials: TutorialItem[];
  count: number;
}

export interface VideoConfig {
  title: string;
  subtitle: string;
  youtube_url: string;
  updated_at: string;
}

export const getTutorials = async (): Promise<TutorialListResponse> => {
  const response = await authApi.get<TutorialListResponse>(
    '/policies/tutorials/',
  );
  return response.data;
};

export const getVideoConfig = async (): Promise<VideoConfig> => {
  const response = await authApi.get<VideoConfig>('/policies/video-config/');
  return response.data;
};

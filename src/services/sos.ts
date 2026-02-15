import { authApi } from './auth';

export interface SOSAlertRequest {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export interface SOSAlertResponse {
  detail: string;
  contacts_notified: number;
  failed_contacts: string[];
  location: {
    latitude: number;
    longitude: number;
    maps_link: string;
  };
}

/**
 * Send SOS alert to all FirstConnect contacts
 * This will send SMS with user's location to emergency contacts
 */
export const sendSOSAlert = async (data: SOSAlertRequest): Promise<SOSAlertResponse> => {
  try {
    console.log('[SOS] Sending SOS alert with location:', data);
    const response = await authApi.post<SOSAlertResponse>('/sos/', data);
    console.log('[SOS] Alert sent successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[SOS] Failed to send alert:', error.response?.data || error.message);
    throw error;
  }
};

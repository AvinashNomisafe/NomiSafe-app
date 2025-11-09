import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEYS = {
  ACCESS_TOKEN: '@nomisafe_access_token',
  REFRESH_TOKEN: '@nomisafe_refresh_token',
  USER_ID: '@nomisafe_user_id',
  PHONE_NUMBER: '@nomisafe_phone_number',
  USER_DATA: '@nomisafe_user_data',
};

export const storeAuthData = async ({
  accessToken,
  refreshToken,
  userId,
  phoneNumber,
  user,
}: {
  accessToken: string;
  refreshToken: string;
  userId: number;
  phoneNumber: string;
  user?: { userId: number; phoneNumber: string; isAadhaarVerified: boolean };
}) => {
  try {
    const items: [string, string][] = [
      [AUTH_KEYS.ACCESS_TOKEN, accessToken],
      [AUTH_KEYS.REFRESH_TOKEN, refreshToken],
      [AUTH_KEYS.USER_ID, userId.toString()],
      [AUTH_KEYS.PHONE_NUMBER, phoneNumber],
    ];

    if (user) {
      items.push([AUTH_KEYS.USER_DATA, JSON.stringify(user)]);
    }

    await AsyncStorage.multiSet(items);
    return true;
  } catch (error) {
    console.error('Error storing auth data:', error);
    return false;
  }
};

export const getAuthData = async () => {
  try {
    const items = await AsyncStorage.multiGet([
      AUTH_KEYS.ACCESS_TOKEN,
      AUTH_KEYS.REFRESH_TOKEN,
      AUTH_KEYS.USER_ID,
      AUTH_KEYS.PHONE_NUMBER,
      AUTH_KEYS.USER_DATA,
    ]);

    const [accessToken, refreshToken, userId, phoneNumber, userData] =
      items.map(item => item[1]);

    let user = null;
    if (userData) {
      try {
        user = JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    return {
      accessToken,
      refreshToken,
      userId: userId ? parseInt(userId) : null,
      phoneNumber,
      user,
    };
  } catch (error) {
    console.error('Error getting auth data:', error);
    return {
      accessToken: null,
      refreshToken: null,
      userId: null,
      phoneNumber: null,
    };
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      AUTH_KEYS.ACCESS_TOKEN,
      AUTH_KEYS.REFRESH_TOKEN,
      AUTH_KEYS.USER_ID,
      AUTH_KEYS.PHONE_NUMBER,
      AUTH_KEYS.USER_DATA,
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

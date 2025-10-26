import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEYS = {
  ACCESS_TOKEN: '@nomisafe_access_token',
  REFRESH_TOKEN: '@nomisafe_refresh_token',
  USER_ID: '@nomisafe_user_id',
  PHONE_NUMBER: '@nomisafe_phone_number',
};

export const storeAuthData = async ({
  accessToken,
  refreshToken,
  userId,
  phoneNumber,
}: {
  accessToken: string;
  refreshToken: string;
  userId: number;
  phoneNumber: string;
}) => {
  try {
    const items: [string, string][] = [
      [AUTH_KEYS.ACCESS_TOKEN, accessToken],
      [AUTH_KEYS.REFRESH_TOKEN, refreshToken],
      [AUTH_KEYS.USER_ID, userId.toString()],
      [AUTH_KEYS.PHONE_NUMBER, phoneNumber],
    ];
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
    ]);

    const [accessToken, refreshToken, userId, phoneNumber] = items.map(
      item => item[1],
    );

    return {
      accessToken,
      refreshToken,
      userId: userId ? parseInt(userId) : null,
      phoneNumber,
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
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

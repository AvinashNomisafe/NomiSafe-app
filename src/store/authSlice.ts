import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '../types/auth';

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  userId: null,
  phoneNumber: null,
  isAadhaarVerified: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (state, action: PayloadAction<Partial<AuthState>>) => {
      return { ...state, ...action.payload };
    },
    setAadhaarVerified: (state, action: PayloadAction<boolean>) => {
      state.isAadhaarVerified = action.payload;
    },
    logout: () => initialState,
  },
});

export const { setAuthState, setAadhaarVerified, logout } = authSlice.actions;
export default authSlice.reducer;

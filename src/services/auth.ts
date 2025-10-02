// Mock authentication service
const MOCK_OTP = '123456';

export const sendOTP = async (phoneNumber: string): Promise<boolean> => {
  // Simulate API delay
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), 1000);
  });

  // Always return success in mock
  console.log('OTP sent to:', phoneNumber);
  return true;
};

export const verifyOTP = async (
  phoneNumber: string,
  otp: string,
): Promise<boolean> => {
  // Simulate API delay
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), 1000);
  });

  // In mock version, any 6-digit OTP will work
  const isValid = otp.length === 6;
  console.log('OTP verification:', isValid ? 'success' : 'failed');
  return isValid;
};

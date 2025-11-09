import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { getAuthData } from '../utils/authStorage';
import { authApi, createAuthenticatedApi } from '../services/auth';
import { useDispatch } from 'react-redux';
import { setAadhaarVerified } from '../store/authSlice';
import axios from 'axios';

type AadhaarVerificationScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'AadhaarVerification'>;
};

export const AadhaarVerificationScreen: React.FC<
  AadhaarVerificationScreenProps
> = ({ navigation }) => {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpReference, setOtpReference] = useState(null);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const { accessToken } = useAuth();
  const dispatch = useDispatch();

  // debug token shown on screen in development to help diagnose 401 issues
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const handleRequestOTP = async () => {
    if (aadhaarNumber.length !== 12) {
      Alert.alert('Error', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }

    try {
      setIsLoading(true);
      // ensure we explicitly attach the access token from storage/context
      const stored = await getAuthData();
      const token = stored?.accessToken || accessToken;
      setDebugToken(token ?? null);

      if (!token) {
        Alert.alert('Error', 'Not authenticated. Please login again.');
        return;
      }

      const api = createAuthenticatedApi(token);
      const response = await api.post('/aadhaar/request-otp/', {
        aadhaar_number: aadhaarNumber,
      });

      setOtpReference(response.data.otp_reference);
      setShowOtpInput(true);
      Alert.alert(
        'Success',
        'OTP has been sent to your registered mobile number',
      );
    } catch (error) {
      console.error('Failed to request OTP:', error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to send OTP. Please try again.'
        : 'Failed to send OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      const stored = await getAuthData();
      const token = stored?.accessToken || accessToken;
      setDebugToken(token ?? null);

      if (!token) {
        Alert.alert('Error', 'Not authenticated. Please login again.');
        return;
      }

      const api = createAuthenticatedApi(token);
      const response = await api.post('/aadhaar/verify-otp/', {
        otp,
        otp_reference: otpReference,
      });

      // Persist Aadhaar verified status in local storage
      const updatedUser = {
        ...(stored.user || {}),
        userId: stored.userId,
        phoneNumber: stored.phoneNumber,
        isAadhaarVerified: true,
      };
      // Save to local storage
      const {
        accessToken: at,
        refreshToken: rt,
        userId: uid,
        phoneNumber: pn,
      } = stored;
      const { storeAuthData } = await import('../utils/authStorage');
      await storeAuthData({
        accessToken: at ?? '',
        refreshToken: rt ?? '',
        userId: uid ?? 0,
        phoneNumber: pn ?? '',
        user: updatedUser,
      });

      dispatch(setAadhaarVerified(true));
      Alert.alert('Success', 'Aadhaar verified successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error ||
          'Failed to verify OTP. Please try again.'
        : 'Failed to verify OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>NOMISAFE</Text>
        </View>

        <View style={styles.illustration}>
          <Text style={styles.illustrationIcon}>🔒</Text>
        </View>

        <Text style={styles.title}>Aadhaar Verification</Text>
        <Text style={styles.subtitle}>
          Please enter your 12-digit Aadhaar number
        </Text>

        {!showOtpInput ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter Aadhaar Number"
              keyboardType="number-pad"
              value={aadhaarNumber}
              onChangeText={text =>
                setAadhaarNumber(text.replace(/[^0-9]/g, ''))
              }
              maxLength={12}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRequestOTP}
              disabled={isLoading || aadhaarNumber.length !== 12}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>GET OTP</Text>
              )}
            </TouchableOpacity>
            {debugToken ? (
              <Text
                style={styles.debugText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                Debug token: {debugToken}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={text => setOtp(text.replace(/[^0-9]/g, ''))}
              maxLength={6}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>VERIFY OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleRequestOTP}
              disabled={isLoading}
            >
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
            {otpReference ? (
              <Text style={styles.debugText}>
                OTP Ref: {String(otpReference)}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  logoWrap: { marginTop: 8, marginBottom: 18 },
  logoText: { color: '#0B7D76', fontWeight: '700', letterSpacing: 2 },
  illustration: {
    width: 220,
    height: 220,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F6F5',
    marginBottom: 24,
  },
  illustrationIcon: { fontSize: 72 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 16 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#4DB6AC',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { backgroundColor: '#A5D1CB' },
  buttonText: { color: '#fff', fontWeight: '700' },
  resendButton: { marginTop: 16 },
  resendText: { color: '#4DB6AC', fontSize: 16 },
  debugText: { marginTop: 8, color: '#777', fontSize: 12, width: '100%' },
});

export default AadhaarVerificationScreen;

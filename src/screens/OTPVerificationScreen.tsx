import React, { useState, useEffect, useRef } from 'react';
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
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import * as authService from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'OTPVerification'>;
  route: RouteProp<RootStackParamList, 'OTPVerification'>;
};

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);

  // Auth context - obtain login to update AuthContext after successful OTP verify
  const { login } = useAuth();

  // refs for 6 inputs
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let intervalId: number | null = null;

    if (timer > 0) {
      intervalId = setInterval(() => {
        setTimer((prev: number) => prev - 1);
      }, 1000) as unknown as number;
    } else {
      setCanResend(true);
    }

    return () => {
      if (intervalId !== null) clearInterval(intervalId as unknown as number);
    };
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.verifyOTP(phoneNumber, otp);

      // Store the auth data in context (login is obtained from top-level hook)
      await login({
        accessToken: response.access,
        refreshToken: response.refresh,
        userId: response.id,
        phoneNumber: response.phone_number,
      });

      const message = response.created
        ? 'Account created and verified successfully!'
        : 'Logged in successfully!';

      // Clear the OTP input before navigating
      setOtp('');
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to verify OTP. Please try again.';

      // Clear the OTP input on error
      setOtp('');

      Alert.alert('Error', errorMessage, [
        {
          text: 'Try Again',
          onPress: () => {
            // Focus the first input
            inputs.current[0]?.focus();
          },
        },
        {
          text: 'Resend OTP',
          onPress: handleResendOTP,
        },
      ]);
      console.error('OTP Verification Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      setIsLoading(true);
      await authService.sendOTP(phoneNumber);
      setTimer(30);
      setCanResend(false);
      Alert.alert('Success', 'OTP resent successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to resend OTP. Please try again.';
      Alert.alert('Error', errorMessage);
      console.error('OTP Resend Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeDigit = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const digits = otp.split('');
    digits[index] = value;
    const newOtp = digits.join('').slice(0, 6);
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const onKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (index > 0) inputs.current[index - 1]?.focus();
    }
  };

  const digits = otp.padEnd(6, ' ').split('').slice(0, 6);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}></View>

        <View style={styles.illustration}>
          <Image
            source={require('../assets/images/phone_login_screen.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>Enter The OTP Sent To {phoneNumber}</Text>

        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={ref => {
                inputs.current[i] = ref;
              }}
              style={styles.otpBox}
              keyboardType="number-pad"
              maxLength={1}
              value={d.trim()}
              onChangeText={val => onChangeDigit(i, val)}
              onKeyPress={e => onKeyPress(i, e)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading || otp.trim().length !== 6}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>VERIFY & LOGIN</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
          )}
        </View>

        <Text style={styles.footer}>Copyright © NOMISAFE 2025.</Text>
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
  logoWrap: {
    marginTop: 8,
    marginBottom: 18,
  },
  logoText: {
    color: '#0B7D76',
    fontWeight: '700',
    letterSpacing: 2,
  },
  illustration: {
    width: 220,
    height: 220,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginTop: 50,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    paddingHorizontal: 30,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  otpBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
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
  resendContainer: { marginTop: 12, alignItems: 'center' },
  resendText: { color: '#4DB6AC', fontSize: 16 },
  timerText: { color: '#666', fontSize: 16 },
  link: { marginTop: 12 },
  linkText: { color: '#007AFF' },
  footer: { marginTop: 28, color: '#888' },
});

export default OTPVerificationScreen;

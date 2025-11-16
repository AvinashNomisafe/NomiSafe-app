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
  Image,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as authService from '../services/auth';

type RootStackParamList = {
  PhoneLogin: undefined;
  OTPVerification: { phoneNumber: string };
};

type PhoneLoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'PhoneLogin'>;
};

const PhoneLoginScreen: React.FC<PhoneLoginScreenProps> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (number: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleContinue = async () => {
    try {
      setError('');
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

      if (!validatePhoneNumber(cleanPhoneNumber)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      setIsLoading(true);
      // Format phone number with country code
      const formattedPhone = `+91${cleanPhoneNumber}`;
      const success = await authService.sendOTP(formattedPhone);

      if (success) {
        navigation.navigate('OTPVerification', {
          phoneNumber: formattedPhone,
        });
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to send OTP. Please try again.';
      Alert.alert('Error', errorMessage);
      console.error('OTP Request Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top logo */}
        <View style={styles.logoWrap}>
          {/* Replace with real logo image if available */}
        </View>

        {/* Illustration */}
        <View style={styles.illustration}>
          <Image
            source={require('../assets/images/phone_login_screen.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Enter Mobile Number For LogIn</Text>
        <Text style={styles.subtitle}>
          We will send an OTP on this number for verification
        </Text>

        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryText}>+91</Text>
          </View>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Enter mobile number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={text => {
              setError('');
              setPhoneNumber(text.replace(/[^0-9]/g, ''));
            }}
            maxLength={10}
            editable={!isLoading}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isLoading || phoneNumber.length < 10}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>GET OTP</Text>
          )}
        </TouchableOpacity>

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
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },
  countryCode: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  countryText: { fontSize: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  inputError: { borderColor: '#ff4d4f' },
  errorText: { color: '#ff4d4f', alignSelf: 'flex-start', marginTop: 4 },
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
  link: { marginTop: 12 },
  linkText: { color: '#007AFF' },
  footer: { marginTop: 28, color: '#888' },
});

export default PhoneLoginScreen;

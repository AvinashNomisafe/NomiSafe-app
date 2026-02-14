import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { createStackNavigator } from '@react-navigation/stack';
import {
  View,
  Text,
  ActivityIndicator,
  NativeModules,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import PhoneLoginScreen from './src/screens/PhoneLoginScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import { RootStackParamList } from './src/types/navigation';
import FallDetectionPopup from './src/components/FallDetectionPopup';

import HomeScreen from './src/screens/HomeScreen';
import ServiceScreen from './src/screens/ServiceScreen';
import SafeVaultScreen from './src/screens/SafeVaultScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MyPolicyScreen from './src/screens/MyPolicyScreen';
import LifeInsuranceScreen from './src/screens/LifeInsuranceScreen';
import HealthInsuranceScreen from './src/screens/HealthInsuranceScreen';
import MotorInsuranceScreen from './src/screens/MotorInsuranceScreen';
import PolicyVerificationScreen from './src/screens/PolicyVerificationScreen';
import PolicyDetailScreen from './src/screens/PolicyDetailScreen';
import PropertiesScreen from './src/screens/PropertiesScreen';
import TutorialsScreen from './src/screens/TutorialsScreen';
import AadhaarVerificationScreen from './src/screens/AadhaarVerificationScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createStackNavigator<RootStackParamList>();

const Navigation = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4DB6AC" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'Home' : 'PhoneLogin'}
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
          <Stack.Screen
            name="OTPVerification"
            component={OTPVerificationScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="MyPolicy" component={MyPolicyScreen} />
          <Stack.Screen name="LifeInsurance" component={LifeInsuranceScreen} />
          <Stack.Screen
            name="HealthInsurance"
            component={HealthInsuranceScreen}
          />
          <Stack.Screen
            name="MotorInsurance"
            component={MotorInsuranceScreen}
          />
          <Stack.Screen
            name="PolicyVerification"
            component={PolicyVerificationScreen}
          />
          <Stack.Screen name="PolicyDetail" component={PolicyDetailScreen} />
          <Stack.Screen name="Properties" component={PropertiesScreen} />
          <Stack.Screen name="Tutorials" component={TutorialsScreen} />
          <Stack.Screen name="Service" component={ServiceScreen} />
          <Stack.Screen name="SafeVault" component={SafeVaultScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen
            name="AadhaarVerification"
            component={AadhaarVerificationScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

function App() {
  useEffect(() => {
    const init = async () => {
      console.log('[FallDetection] Starting initialization...');

      if (Platform.OS === 'android') {
        try {
          // Request necessary permissions
          const permissions = [
            'android.permission.POST_NOTIFICATIONS',
            'android.permission.VIBRATE',
            'android.permission.WAKE_LOCK',
            'android.permission.ACTIVITY_RECOGNITION',
            'android.permission.HIGH_SAMPLING_RATE_SENSORS',
          ];

          for (const permission of permissions) {
            if (
              Platform.Version >= 33 ||
              permission !== 'android.permission.POST_NOTIFICATIONS'
            ) {
              const result = await PermissionsAndroid.request(
                permission as any,
              );
              console.log(`[FallDetection] ${permission}: ${result}`);
            }
          }

          console.log('[FallDetection] Starting fall detection service...');
          // NativeModules.FallDetectionModule?.startService();
          console.log('[FallDetection] Service started successfully');
        } catch (e) {
          console.log('Fall detection service init failed', e);
        }
      } else if (Platform.OS === 'ios') {
        // For iOS, we'll need to implement a native module
        console.log('[FallDetection] iOS fall detection setup would go here');
        // NativeModules.FallDetectionModule?.startDetection();
      }
    };

    // Start with a slight delay to ensure app is ready
    const timer = setTimeout(() => {
      init();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <Provider store={store}>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Navigation />
          </NavigationContainer>
          {/* Fall Detection Full-Screen Popup - appears above all screens */}
          <FallDetectionPopup />
        </SafeAreaProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;

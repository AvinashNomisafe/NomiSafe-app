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

import HomeScreen from './src/screens/HomeScreen';
import ServiceScreen from './src/screens/ServiceScreen';
import SafeVaultScreen from './src/screens/SafeVaultScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MyPolicyScreen from './src/screens/MyPolicyScreen';
import InsuranceScreen from './src/screens/InsuranceScreen';
import PolicyVerificationScreen from './src/screens/PolicyVerificationScreen';
import PolicyDetailScreen from './src/screens/PolicyDetailScreen';
import PropertiesScreen from './src/screens/PropertiesScreen';
import TutorialsScreen from './src/screens/TutorialsScreen';
import AadhaarVerificationScreen from './src/screens/AadhaarVerificationScreen';

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
          <Stack.Screen name="MyPolicy" component={MyPolicyScreen} />
          <Stack.Screen name="Insurance" component={InsuranceScreen} />
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
      if (Platform.OS === 'android') {
        try {
          console.log('[ShakeService] Starting initialization...');
          if (Platform.Version >= 33) {
            const result = await PermissionsAndroid.request(
              'android.permission.POST_NOTIFICATIONS',
            );
            console.log('[ShakeService] Notification permission:', result);
          }
          console.log('[ShakeService] About to start service...');
          NativeModules.ShakeServiceModule?.startService();
          console.log('[ShakeService] Service start called');
        } catch (e) {
          console.log('Shake service init failed', e);
        }
      }
    };
    init();
  }, []);
  return (
    <Provider store={store}>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Navigation />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;

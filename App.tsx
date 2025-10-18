import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import PhoneLoginScreen from './src/screens/PhoneLoginScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import { RootStackParamList } from './src/types/navigation';

import HomeScreen from './src/screens/HomeScreen';
import ServiceScreen from './src/screens/ServiceScreen';
import SafeVaultScreen from './src/screens/SafeVaultScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MyPolicyScreen from './src/screens/MyPolicyScreen';
import InsuranceScreen from './src/screens/InsuranceScreen';
import PropertiesScreen from './src/screens/PropertiesScreen';
import TutorialsScreen from './src/screens/TutorialsScreen';

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="PhoneLogin"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4DB6AC',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="PhoneLogin"
          component={PhoneLoginScreen}
          options={{ title: 'Login' }}
        />
        <Stack.Screen
          name="OTPVerification"
          component={OTPVerificationScreen}
          options={{ title: 'Verify OTP' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyPolicy"
          component={MyPolicyScreen}
          options={{
            title: 'My Policy',
            headerStyle: {
              backgroundColor: '#4DB6AC',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="Insurance"
          component={InsuranceScreen}
          options={{
            title: 'Insurance',
            headerStyle: {
              backgroundColor: '#4DB6AC',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="Properties"
          component={PropertiesScreen}
          options={{
            title: 'Properties',
            headerStyle: {
              backgroundColor: '#4DB6AC',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="Tutorials"
          component={TutorialsScreen}
          options={{
            title: 'Tutorials',
            headerStyle: {
              backgroundColor: '#4DB6AC',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="Service"
          component={ServiceScreen}
          options={{ title: 'Service' }}
        />
        <Stack.Screen
          name="SafeVault"
          component={SafeVaultScreen}
          options={{ title: 'Safe Vault' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

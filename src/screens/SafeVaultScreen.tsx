import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';

const SafeVaultScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Safe Vault</Text>
        <Text style={styles.banner}>COMING SOON</Text>
      </View>
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  banner: {
    fontSize: 24,
    color: '#4DB6AC',
    fontWeight: '600',
  },
});

export default SafeVaultScreen;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';

const PropertiesScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={styles.icon}>🏠</Text>
        <Text style={styles.title}>Properties</Text>
        <Text style={styles.banner}>COMING SOON</Text>
      </View>
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
  icon: {
    fontSize: 64,
    marginBottom: 16,
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

export default PropertiesScreen;

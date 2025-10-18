import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SafeVaultScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safe Vault</Text>
      <Text style={styles.banner}>COMING SOON</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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

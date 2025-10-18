import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TutorialsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📚</Text>
        <Text style={styles.title}>Tutorials</Text>
        <Text style={styles.banner}>COMING SOON</Text>
      </View>
    </View>
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

export default TutorialsScreen;

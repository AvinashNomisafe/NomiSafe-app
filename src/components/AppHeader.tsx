import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AppHeader: React.FC = () => {
  const insets = useSafeAreaInsets();
  const headerHeight = 56;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(12, insets.top + 6),
          height: insets.top + headerHeight,
        },
      ]}
    >
      <View style={styles.inner}>
        <Text style={styles.logoText}>NOMISAFE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderBottomWidth: 0,
    zIndex: 10,
  },
  inner: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#0B7D76',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 2,
  },
});

export default AppHeader;

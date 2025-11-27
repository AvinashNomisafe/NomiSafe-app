import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const BottomNavigation: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  const navItems = [
    { key: 'Home', icon: '🏠', label: 'Home' },
    { key: 'Service', icon: '⚙️', label: 'Service' },
    { key: 'SafeVault', icon: '🔒', label: 'Safe Vault' },
    { key: 'Profile', icon: '👤', label: 'Profile' },
  ] as const;

  return (
    <View style={styles.bottomNav}>
      {navItems.map(item => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.bottomNavItem,
            route.name === item.key && styles.bottomNavItemActive,
          ]}
          onPress={() => navigation.navigate(item.key as any)}
        >
          <Text style={styles.bottomNavIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.bottomNavText,
              route.name === item.key && styles.bottomNavTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  bottomNavItemActive: {
    backgroundColor: '#f0f0f0',
  },
  bottomNavIcon: {
    fontSize: 24,
  },
  bottomNavText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  bottomNavTextActive: {
    color: '#4DB6AC',
    fontWeight: '600',
  },
});

export default BottomNavigation;

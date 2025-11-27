import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomNavigation = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const current = route.name;

  const Item = ({
    label,
    isActive,
    onPress,
    children,
  }: {
    label: string;
    isActive: boolean;
    onPress: () => void;
    children: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      {children}
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Home - MaterialCommunityIcons (most reliable) */}
      <Item
        label="Home"
        isActive={current === 'Home'}
        onPress={() => navigation.navigate('Home')}
      >
        <MaterialCommunityIcons
          name="home"
          size={28}
          color={current === 'Home' ? '#15A3A3' : '#7A7A7A'}
          style={styles.iconVector}
        />
      </Item>

      {/* Service - MaterialCommunityIcons */}
      <Item
        label="Service"
        isActive={current === 'Service'}
        onPress={() => navigation.navigate('Service')}
      >
        <MaterialCommunityIcons
          name="cog"
          size={28}
          color={current === 'Service' ? '#15A3A3' : '#7A7A7A'}
          style={styles.iconVector}
        />
      </Item>

      {/* Safe Vault - MaterialCommunityIcons */}
      <Item
        label="Safe Vault"
        isActive={current === 'SafeVault'}
        onPress={() => navigation.navigate('SafeVault')}
      >
        <MaterialCommunityIcons
          name="lock"
          size={28}
          color={current === 'SafeVault' ? '#15A3A3' : '#7A7A7A'}
          style={styles.iconVector}
        />
      </Item>

      {/* Profile - MaterialCommunityIcons */}
      <Item
        label="Profile"
        isActive={current === 'Profile'}
        onPress={() => navigation.navigate('Profile')}
      >
        <MaterialCommunityIcons
          name="account"
          size={28}
          color={current === 'Profile' ? '#15A3A3' : '#7A7A7A'}
          style={styles.iconVector}
        />
      </Item>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  item: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: '#7A7A7A',
    fontWeight: '500',
  },
  labelActive: {
    color: '#15A3A3',
    fontWeight: '700',
  },
  iconVector: {
    marginTop: 2,
  },
});

export default BottomNavigation;

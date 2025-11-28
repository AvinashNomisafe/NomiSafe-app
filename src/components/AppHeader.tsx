import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface AppHeaderProps {
  showBackButton?: boolean;
  showMenu?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  showBackButton = true,
  showMenu = false,
}) => {
  const insets = useSafeAreaInsets();

  // Try to get navigation, but don't fail if not available
  let navigation: any = null;
  try {
    navigation = useNavigation();
  } catch (e) {
    // Navigation not available, that's okay
  }

  const handleMenuPress = () => {
    if (navigation && typeof navigation.toggleDrawer === 'function') {
      navigation.toggleDrawer();
    }
  };

  const handleBackPress = () => {
    if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    }
  };

  return (
    <>
      {/* Safe area top background */}
      <View style={[styles.safeAreaTop, { height: insets.top }]} />

      {/* Main Header */}
      <View style={styles.header}>
        {/* Left Section - Menu or Back Button */}
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
            <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Center Section - Logo */}
        <View style={styles.centerSection}>
          <Image
            source={require('../assets/icons/Nomisafe_banner.png')}
            style={styles.bannerImage}
            resizeMode="contain"
          />
        </View>

        {/* Right Section - Language & Notification */}
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton}>
            <View style={styles.languageButton}>
              <MaterialCommunityIcons
                name="translate"
                size={20}
                color="#4DB6AC"
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  safeAreaTop: {
    backgroundColor: '#4DB6AC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4DB6AC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  leftSection: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 8,
  },
  bannerImage: {
    width: 100,
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  languageIcon: {
    fontSize: 14,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(255, 255, 255)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
});

export default AppHeader;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

interface AppHeaderProps {
  showBackButton?: boolean;
  showMenu?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  showBackButton = false,
  showMenu = true,
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
          {showMenu && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleMenuPress}
            >
              <View style={styles.menuIcon}>
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
              </View>
            </TouchableOpacity>
          )}
          {showBackButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackPress}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center Section - Logo */}
        <View style={styles.centerSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>👨‍👩‍👧‍👦</Text>
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTitle}>NOMISAFE</Text>
              <Text style={styles.logoSubtitle}>
                FOREVER SECURITY FOR FAMILIES
              </Text>
            </View>
          </View>
        </View>

        {/* Right Section - Language & Notification */}
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton}>
            <View style={styles.languageButton}>
              <Text style={styles.languageText}>A</Text>
              <Text style={styles.languageIcon}>🌐</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.bellIcon}>🔔</Text>
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
    width: 60,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 8,
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 24,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  backArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoIconText: {
    fontSize: 20,
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4DB6AC',
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    fontSize: 7.5,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    gap: 4,
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  languageIcon: {
    fontSize: 14,
  },
  bellIcon: {
    fontSize: 22,
  },
});

export default AppHeader;

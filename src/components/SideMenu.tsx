import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const slideAnim = React.useRef(new Animated.Value(-300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const menuItems = [
    {
      id: 1,
      title: 'Home',
      icon: 'home',
      iconType: 'Ionicons' as const,
      route: 'Home' as keyof RootStackParamList,
    },
    {
      id: 2,
      title: 'Service',
      icon: 'briefcase',
      iconType: 'Ionicons' as const,
      route: 'Service' as keyof RootStackParamList,
    },
    {
      id: 3,
      title: 'SafeVault',
      icon: 'shield-checkmark',
      iconType: 'Ionicons' as const,
      route: 'SafeVault' as keyof RootStackParamList,
    },
    {
      id: 4,
      title: 'Profile',
      icon: 'person',
      iconType: 'Ionicons' as const,
      route: 'Profile' as keyof RootStackParamList,
    },
    {
      id: 5,
      title: 'Health Insurance',
      icon: 'medical',
      iconType: 'Ionicons' as const,
      route: 'HealthInsurance' as keyof RootStackParamList,
    },
    {
      id: 6,
      title: 'Life Insurance',
      icon: 'heart',
      iconType: 'Ionicons' as const,
      route: 'LifeInsurance' as keyof RootStackParamList,
    },
    {
      id: 7,
      title: 'Properties',
      icon: 'home-city',
      iconType: 'MaterialCommunityIcons' as const,
      route: 'Properties' as keyof RootStackParamList,
    },
    {
      id: 8,
      title: 'Tutorials',
      icon: 'school',
      iconType: 'Ionicons' as const,
      route: 'Tutorials' as keyof RootStackParamList,
    },
  ];

  const handleNavigation = (route: keyof RootStackParamList) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(route);
    }, 200);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.menuHeader}>
          <Image
            source={require('../assets/icons/Nomisafe_banner.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuItemsContainer}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route)}
            >
              {item.iconType === 'Ionicons' ? (
                <Ionicons name={item.icon as any} size={24} color="#4DB6AC" />
              ) : (
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={24}
                  color="#4DB6AC"
                />
              )}
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.menuFooter}>
          <Text style={styles.footerText}>NomiSafe v1.0</Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logo: {
    width: 120,
    height: 40,
  },
  closeButton: {
    padding: 5,
  },
  menuItemsContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 20,
    fontWeight: '500',
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default SideMenu;

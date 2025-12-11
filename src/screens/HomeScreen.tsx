import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard'>('home');

  const menuItems = [
    {
      id: 1,
      title: 'Life Insurance',
      icon: require('../assets/icons/policy_icon.png'),
      route: 'LifeInsurance' as keyof RootStackParamList,
    },
    {
      id: 2,
      title: 'Health Insurance',
      icon: require('../assets/icons/insurance_icon.png'),
      route: 'HealthInsurance' as keyof RootStackParamList,
    },
    {
      id: 3,
      title: 'Properties',
      icon: require('../assets/icons/properties_icon.png'),
      route: 'Properties' as keyof RootStackParamList,
    },
    {
      id: 4,
      title: 'Tutorials',
      icon: require('../assets/icons/tutorials_icon.png'),
      route: 'Tutorials' as keyof RootStackParamList,
    },
  ];

  const renderMenuGrid = () => (
    <View style={styles.menuGrid}>
      {menuItems.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuItem}
          onPress={() => navigation.navigate(item.route as any)}
        >
          <Image
            source={item.icon}
            style={styles.menuIconImage}
            resizeMode="contain"
          />
          <Text style={styles.menuTitle}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <Text style={styles.dashboardTitle}>Dashboard</Text>
      <Text style={styles.dashboardSubtitle}>
        Your financial overview and analytics
      </Text>

      <View style={styles.comingSoonContainer}>
        <Text style={styles.comingSoonIcon}>📊</Text>
        <Text style={styles.comingSoonText}>Coming Soon</Text>
        <Text style={styles.comingSoonSubtext}>
          We're building comprehensive financial analytics and insights for you
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'home' && styles.toggleButtonActive,
          ]}
          onPress={() => setActiveTab('home')}
        >
          <Text
            style={[
              styles.toggleButtonText,
              activeTab === 'home' && styles.toggleButtonTextActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'dashboard' && styles.toggleButtonActive,
          ]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text
            style={[
              styles.toggleButtonText,
              activeTab === 'dashboard' && styles.toggleButtonTextActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'home' ? renderMenuGrid() : renderDashboard()}
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#4DB6AC',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  dashboardContainer: {
    padding: 20,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4DB6AC',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4DB6AC',
  },
  backButton: {
    fontSize: 24,
    color: '#fff',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#fff',
  },
  menuItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuIconImage: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default HomeScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { getProfile, UserProfile } from '../services/profile';
import { getPolicies, PolicyListResponse } from '../services/policy';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard'>('home');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [policyData, setPolicyData] = useState<PolicyListResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const [profileData, policies] = await Promise.all([
        getProfile().catch(() => null),
        getPolicies().catch(() => null),
      ]);
      setProfile(profileData);
      setPolicyData(policies);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

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

  const renderProgressChecklist = () => {
    // Calculate checklist completion
    const isProfileComplete = !!(
      profile?.profile?.name &&
      profile?.email &&
      profile?.profile?.date_of_birth
    );
    const hasHealthInsurance = (policyData?.health.length || 0) > 0;
    const hasLifeInsurance = (policyData?.life.length || 0) > 0;

    const completedSteps = [
      isProfileComplete,
      hasHealthInsurance,
      hasLifeInsurance,
    ].filter(Boolean).length;

    const totalSteps = 3;
    const progressPercentage = (completedSteps / totalSteps) * 100;

    const checklistItems = [
      {
        id: 1,
        text: 'Complete your profile (Name, Email, DOB)',
        completed: isProfileComplete,
        action: () => navigation.navigate('Profile'),
      },
      {
        id: 2,
        text: 'Add your first Health Insurance',
        completed: hasHealthInsurance,
        action: () => navigation.navigate('HealthInsurance'),
      },
      {
        id: 3,
        text: 'Add your first Life Insurance',
        completed: hasLifeInsurance,
        action: () => navigation.navigate('LifeInsurance'),
      },
    ];

    return (
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color="#4DB6AC"
          />
          <Text style={styles.progressTitle}>Getting Started</Text>
        </View>

        {checklistItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.checklistItem,
              index === checklistItems.length - 1 && styles.checklistItemLast,
            ]}
            onPress={item.action}
            disabled={item.completed}
          >
            <View
              style={[
                styles.checklistIcon,
                item.completed
                  ? styles.checklistIconComplete
                  : styles.checklistIconIncomplete,
              ]}
            >
              {item.completed && (
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              )}
            </View>
            <Text
              style={[
                styles.checklistText,
                item.completed && styles.checklistTextComplete,
              ]}
            >
              {item.text}
            </Text>
            {!item.completed && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#999"
              />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.progressBar}>
          <Text style={styles.progressBarLabel}>
            {completedSteps} of {totalSteps} steps completed
          </Text>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderMenuGrid = () => (
    <>
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
      <View style={styles.checklistContainer}>
        {isLoadingData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4DB6AC" />
          </View>
        ) : (
          renderProgressChecklist()
        )}
      </View>
    </>
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
  checklistContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  progressSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checklistItemLast: {
    borderBottomWidth: 0,
  },
  checklistIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checklistIconComplete: {
    backgroundColor: '#4CAF50',
  },
  checklistIconIncomplete: {
    backgroundColor: '#E0E0E0',
  },
  checklistText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  checklistTextComplete: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  progressBar: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  progressBarLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4DB6AC',
    borderRadius: 4,
  },
});

export default HomeScreen;

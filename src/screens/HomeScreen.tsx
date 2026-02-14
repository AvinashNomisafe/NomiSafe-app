import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

// Components
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import ImageCarousel from '../components/ImageCarousel';
import {
  LoadingSpinner,
  TabToggle,
  MenuGrid,
  ProgressChecklist,
} from '../components/reusable';
import HeroSection from '../components/HeroSection';
import FirstConnectCTA from '../components/FirstConnectCTA';
import AddDocumentsSection from '../components/AddDocumentsSection';

// Services
import { getProfile, UserProfile } from '../services/profile';
import { getPolicies, PolicyListResponse } from '../services/policy';

// Utils & Constants
import { colors, spacing, typography } from '../constants/theme';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Constants
const TABS = [
  { value: 'home', label: 'Home' },
  { value: 'dashboard', label: 'Dashboard' },
];

const MENU_ITEMS = [
  {
    id: 1,
    title: 'My Policy',
    icon: require('../assets/icons/myPolicyIcon.png'),
    route: 'LifeInsurance',
  },
  {
    id: 2,
    title: 'Nominees',
    icon: require('../assets/icons/nomineesIcon.png'),
    route: 'HealthInsurance',
  },
  {
    id: 3,
    title: 'Properties',
    icon: require('../assets/icons/propertiesIcon.png'),
    route: 'Properties',
  },
  {
    id: 4,
    title: 'First Connect',
    icon: require('../assets/icons/firstConnectIcon.png'),
    route: 'Tutorials',
  },
];

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard'>('home');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [policyData, setPolicyData] = useState<PolicyListResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      navigation.navigate('Dashboard');
      setActiveTab('home');
    }
  }, [activeTab, navigation]);

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

  // Build checklist items based on profile and policy data
  const getChecklistItems = () => {
    const isProfileComplete = !!(
      profile?.profile?.name &&
      profile?.email &&
      profile?.profile?.date_of_birth
    );
    const hasHealthInsurance = (policyData?.health.length || 0) > 0;
    const hasLifeInsurance = (policyData?.life.length || 0) > 0;

    return [
      {
        id: 1,
        text: 'Complete your profile',
        completed: isProfileComplete,
        route: 'Profile',
      },
      {
        id: 2,
        text: 'Add your first Health Insurance',
        completed: hasHealthInsurance,
        route: 'HealthInsurance',
      },
      {
        id: 3,
        text: 'Add your first Life Insurance',
        completed: hasLifeInsurance,
        route: 'LifeInsurance',
      },
    ];
  };

  const handleChecklistItemPress = (item: { route?: string }) => {
    if (item.route) {
      navigation.navigate(item.route as any);
    }
  };

  const handleMenuItemPress = (route: string) => {
    navigation.navigate(route as any);
  };

  // Render Home Tab Content
  const renderHomeContent = () => (
    <>
      <MenuGrid items={MENU_ITEMS} onItemPress={handleMenuItemPress} />

      <Text
        style={{
          width: '90%',
          alignSelf: 'center',
          marginTop: 25,
          textAlign: 'center',
          fontWeight: '400',
          fontSize: typography.fontSize.md,
          color: colors.text.primary,
          lineHeight: 22,
        }}
      >
        Your safety today. Your family’s security tomorrow with{' '}
        <Text style={{ color: '#139DA4' }}>Nomisafe</Text>.
      </Text>

      <FirstConnectCTA onAddPress={() => navigation.navigate('/')} />

      <AddDocumentsSection
        onItemPress={item => navigation.navigate(item.route)}
      />

      <View style={styles.checklistContainer}>
        {isLoadingData ? (
          <LoadingSpinner />
        ) : (
          <ProgressChecklist
            items={getChecklistItems()}
            onItemPress={handleChecklistItemPress}
          />
        )}
      </View>

      <ImageCarousel />
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection />

        <View style={styles.contentWrapper}>
          <TabToggle
            tabs={TABS}
            activeTab={activeTab}
            onChange={value => setActiveTab(value as 'home' | 'dashboard')}
          />

          {renderHomeContent()}
        </View>
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    marginTop: -40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.background.white,
  },
  checklistContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});

export default HomeScreen;

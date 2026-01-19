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
import ImageCarousel from '../components/ImageCarousel';
import { getProfile, UserProfile } from '../services/profile';
import {
  getPolicies,
  PolicyListResponse,
  getDashboardStats,
  DashboardStats,
} from '../services/policy';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard'>('home');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [policyData, setPolicyData] = useState<PolicyListResponse | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' && !dashboardStats) {
      loadDashboardData();
    }
  }, [activeTab]);

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

  const loadDashboardData = async () => {
    try {
      setIsLoadingDashboard(true);
      const stats = await getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoadingDashboard(false);
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
    {
      id: 5,
      title: 'Fall Detection',
      icon: require('../assets/icons/fall_detection_icon.png'),
      route: 'FallDetection' as keyof RootStackParamList,
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
        text: 'Complete your profile',
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
      <View style={styles.checklistBox}>
        <Text style={styles.checklistTitle}>Pending Tasks</Text>
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
      <ImageCarousel />
    </>
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderDashboard = () => {
    if (isLoadingDashboard) {
      return (
        <View style={styles.dashboardContainer}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>
            Your financial overview and analytics
          </Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4DB6AC" />
            <Text style={styles.loadingText}>Loading your analytics...</Text>
          </View>
        </View>
      );
    }

    if (!dashboardStats) {
      return (
        <View style={styles.dashboardContainer}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>
            Your financial overview and analytics
          </Text>
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyStateText}>No data available</Text>
          </View>
        </View>
      );
    }

    const {
      summary,
      life_insurance,
      health_insurance,
      upcoming_renewals,
      recent_policies,
    } = dashboardStats;

    return (
      <View style={styles.dashboardContainer}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
            <MaterialCommunityIcons
              name="shield-account"
              size={32}
              color="#fff"
            />
            <Text style={styles.summaryCardValue}>
              {summary.total_policies}
            </Text>
            <Text style={styles.summaryCardLabel}>Total Policies</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardSecondary]}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={32}
              color="#fff"
            />
            <Text style={styles.summaryCardValue}>
              {formatCurrency(summary.total_monthly_premium)}
            </Text>
            <Text style={styles.summaryCardLabel}>Monthly Premium</Text>
          </View>
        </View>

        {/* Life Insurance Stats */}
        {life_insurance.total_policies > 0 && (
          <View style={styles.statsSection}>
            <View style={styles.statsSectionHeader}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={24}
                color="#E91E63"
              />
              <Text style={styles.statsSectionTitle}>Life Insurance</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Coverage</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(life_insurance.total_sum_assured)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Monthly Premium</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(life_insurance.total_premium)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Active Policies</Text>
                <Text style={styles.statValue}>
                  {life_insurance.active_policies}
                </Text>
              </View>
              {life_insurance.total_maturity_amount > 0 && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Maturity Amount</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(life_insurance.total_maturity_amount)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Health Insurance Stats */}
        {health_insurance.total_policies > 0 && (
          <View style={styles.statsSection}>
            <View style={styles.statsSectionHeader}>
              <MaterialCommunityIcons
                name="medical-bag"
                size={24}
                color="#4CAF50"
              />
              <Text style={styles.statsSectionTitle}>Health Insurance</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Coverage</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(health_insurance.total_sum_assured)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Monthly Premium</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(health_insurance.total_premium)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Active Policies</Text>
                <Text style={styles.statValue}>
                  {health_insurance.active_policies}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Upcoming Renewals */}
        {upcoming_renewals.length > 0 && (
          <View style={styles.renewalsSection}>
            <View style={styles.renewalsSectionHeader}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={24}
                color="#FF9800"
              />
              <Text style={styles.renewalsSectionTitle}>Upcoming Renewals</Text>
            </View>
            {upcoming_renewals.map(renewal => (
              <TouchableOpacity
                key={renewal.id}
                style={styles.renewalItem}
                onPress={() =>
                  navigation.navigate('MyPolicy', { policyId: renewal.id })
                }
              >
                <View style={styles.renewalItemLeft}>
                  <Text style={styles.renewalItemName}>{renewal.name}</Text>
                  <Text style={styles.renewalItemInsurer}>
                    {renewal.insurer_name}
                  </Text>
                  <Text style={styles.renewalItemPremium}>
                    Premium: {formatCurrency(renewal.premium_amount)}
                  </Text>
                </View>
                <View style={styles.renewalItemRight}>
                  <View
                    style={[
                      styles.renewalBadge,
                      renewal.days_remaining <= 30 && styles.renewalBadgeUrgent,
                    ]}
                  >
                    <Text style={styles.renewalBadgeText}>
                      {renewal.days_remaining} days
                    </Text>
                  </View>
                  <Text style={styles.renewalItemDate}>
                    {formatDate(renewal.end_date)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Policies */}
        {recent_policies.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentSectionHeader}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={24}
                color="#2196F3"
              />
              <Text style={styles.recentSectionTitle}>Recent Policies</Text>
            </View>
            {recent_policies.map(policy => (
              <TouchableOpacity
                key={policy.id}
                style={styles.recentItem}
                onPress={() =>
                  navigation.navigate('MyPolicy', { policyId: policy.id })
                }
              >
                <View style={styles.recentItemLeft}>
                  <View
                    style={[
                      styles.recentItemIcon,
                      policy.insurance_type === 'LIFE'
                        ? styles.recentItemIconLife
                        : styles.recentItemIconHealth,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        policy.insurance_type === 'LIFE'
                          ? 'heart-pulse'
                          : 'medical-bag'
                      }
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View>
                    <Text style={styles.recentItemName}>{policy.name}</Text>
                    <Text style={styles.recentItemInsurer}>
                      {policy.insurer_name}
                    </Text>
                  </View>
                </View>
                <View style={styles.recentItemRight}>
                  <Text style={styles.recentItemAmount}>
                    {formatCurrency(policy.sum_assured)}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color="#ccc"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

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
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryCardPrimary: {
    backgroundColor: '#4DB6AC',
  },
  summaryCardSecondary: {
    backgroundColor: '#FF9800',
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  statsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  renewalsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  renewalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  renewalsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  renewalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  renewalItemLeft: {
    flex: 1,
  },
  renewalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  renewalItemInsurer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  renewalItemPremium: {
    fontSize: 13,
    color: '#4DB6AC',
    fontWeight: '500',
  },
  renewalItemRight: {
    alignItems: 'flex-end',
  },
  renewalBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
  },
  renewalBadgeUrgent: {
    backgroundColor: '#FF5722',
  },
  renewalBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  renewalItemDate: {
    fontSize: 13,
    color: '#666',
  },
  recentSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentItemIconLife: {
    backgroundColor: '#E91E63',
  },
  recentItemIconHealth: {
    backgroundColor: '#4CAF50',
  },
  recentItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  recentItemInsurer: {
    fontSize: 14,
    color: '#666',
  },
  recentItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentItemAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4DB6AC',
    marginRight: 8,
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
  checklistBox: {
    marginTop: 16,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
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

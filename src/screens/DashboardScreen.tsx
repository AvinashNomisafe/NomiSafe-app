import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

// Components
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import {
  LoadingSpinner,
  EmptyState,
  SummaryCard,
  StatsSection,
  RenewalsList,
  RecentPoliciesList,
} from '../components/reusable';

// Services
import { getDashboardStats, DashboardStats } from '../services/policy';

// Utils & Constants
import { formatCurrency } from '../utils/formatters';
import { colors, spacing, typography } from '../constants/theme';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const handleRenewalPress = (renewal: { id: number | string }) => {
    navigation.navigate('MyPolicy', { policyId: renewal.id as number });
  };

  const handlePolicyPress = (policy: { id: number | string }) => {
    navigation.navigate('MyPolicy', { policyId: policy.id as number });
  };

  if (isLoadingDashboard) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader />
        <ScrollView style={styles.scrollView}>
          <View style={styles.dashboardContainer}>
            <Text style={styles.dashboardTitle}>Dashboard</Text>
            <Text style={styles.dashboardSubtitle}>
              Your financial overview and analytics
            </Text>
            <LoadingSpinner size="large" message="Loading your analytics..." />
          </View>
        </ScrollView>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  if (!dashboardStats) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader />
        <ScrollView style={styles.scrollView}>
          <View style={styles.dashboardContainer}>
            <Text style={styles.dashboardTitle}>Dashboard</Text>
            <Text style={styles.dashboardSubtitle}>
              Your financial overview and analytics
            </Text>
            <EmptyState
              iconName="chart-box-outline"
              message="No data available"
            />
          </View>
        </ScrollView>
        <BottomNavigation />
      </SafeAreaView>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        <View style={styles.dashboardContainer}>
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <SummaryCard
              iconName="shield-account"
              value={summary.total_policies}
              label="Total Policies"
              backgroundColor={colors.primary.main}
            />
            <SummaryCard
              iconName="cash-multiple"
              value={formatCurrency(summary.total_monthly_premium)}
              label="Monthly Premium"
              backgroundColor={colors.secondary.orange}
            />
          </View>

          {/* Life Insurance Stats */}
          {life_insurance.total_policies > 0 && (
            <StatsSection
              iconName="heart-pulse"
              iconColor={colors.insurance.life}
              title="Life Insurance"
              stats={[
                {
                  label: 'Total Coverage',
                  value: formatCurrency(life_insurance.total_sum_assured),
                },
                {
                  label: 'Monthly Premium',
                  value: formatCurrency(life_insurance.total_premium),
                },
                {
                  label: 'Active Policies',
                  value: life_insurance.active_policies,
                },
                ...(life_insurance.total_maturity_amount > 0
                  ? [
                      {
                        label: 'Maturity Amount',
                        value: formatCurrency(
                          life_insurance.total_maturity_amount,
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          )}

          {/* Health Insurance Stats */}
          {health_insurance.total_policies > 0 && (
            <StatsSection
              iconName="medical-bag"
              iconColor={colors.insurance.health}
              title="Health Insurance"
              stats={[
                {
                  label: 'Total Coverage',
                  value: formatCurrency(health_insurance.total_sum_assured),
                },
                {
                  label: 'Monthly Premium',
                  value: formatCurrency(health_insurance.total_premium),
                },
                {
                  label: 'Active Policies',
                  value: health_insurance.active_policies,
                },
              ]}
            />
          )}

          {/* Upcoming Renewals */}
          <RenewalsList
            renewals={upcoming_renewals}
            onItemPress={handleRenewalPress}
          />

          {/* Recent Policies */}
          <RecentPoliciesList
            policies={recent_policies}
            onItemPress={handlePolicyPress}
          />
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  dashboardContainer: {
    padding: spacing.xl,
  },
  dashboardTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.black,
    marginBottom: spacing.sm,
  },
  dashboardSubtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing['2xl'],
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
});

export default DashboardScreen;

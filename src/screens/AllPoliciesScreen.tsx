import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import {
  getPolicies,
  PolicyListResponse,
  PolicyListItem,
} from '../services/policy';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';

type AllPoliciesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AllPolicies'
>;

const AllPoliciesScreen: React.FC = () => {
  const navigation = useNavigation<AllPoliciesScreenNavigationProp>();
  const [policyData, setPolicyData] = useState<PolicyListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadPolicies();
    }, []),
  );

  const loadPolicies = async () => {
    try {
      setIsLoading(true);
      const data = await getPolicies();
      setPolicyData(data);
    } catch (error) {
      console.error('Failed to load policies:', error);
      Alert.alert('Error', 'Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getInsuranceTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      LIFE: '🛡️',
      HEALTH: '🏥',
      MOTOR: '🚗',
    };
    return icons[type] || '📄';
  };

  const getInsuranceTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      LIFE: '#4DB6AC',
      HEALTH: '#4DB6AC',
      MOTOR: '#4DB6AC',
    };
    return colors[type] || '#4DB6AC';
  };

  const renderPolicyCard = (policy: PolicyListItem) => {
    return (
      <TouchableOpacity
        key={policy.id}
        style={[styles.policyCard, policy.is_expired && styles.expiredCard]}
        onPress={() =>
          navigation.navigate('PolicyDetail', { policyId: policy.id })
        }
      >
        <View style={styles.policyHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.policyName}>{policy.name}</Text>
            <Text style={styles.insurerName}>{policy.insurer_name}</Text>
          </View>
          <Text
            style={[
              styles.typeIcon,
              { color: getInsuranceTypeColor(policy.insurance_type) },
            ]}
          >
            {getInsuranceTypeIcon(policy.insurance_type)}
          </Text>
        </View>

        {policy.policy_number && (
          <Text style={styles.policyNumber}>{policy.policy_number}</Text>
        )}

        <View style={styles.policyDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Premium</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(policy.premium_amount)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              {policy.insurance_type === 'MOTOR' ? 'IDV' : 'Cover'}
            </Text>
            <Text style={styles.detailValue}>
              {formatCurrency(policy.sum_assured)}
            </Text>
          </View>
        </View>

        {policy.end_date && (
          <Text
            style={[styles.endDate, policy.is_expired && styles.expiredText]}
          >
            Valid Until: {new Date(policy.end_date).toLocaleDateString('en-IN')}
            {policy.is_expired && ' (Expired)'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderPolicySection = (
    title: string,
    icon: string,
    policies: PolicyListItem[],
  ) => {
    if (!policies || policies.length === 0) return null;

    return (
      <View key={title} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>{policies.length}</Text>
          </View>
        </View>
        {policies.map(renderPolicyCard)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>📋</Text>
          <Text style={styles.pageTitle}>All Policies</Text>

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#4DB6AC"
              style={styles.loader}
            />
          ) : policyData &&
            (policyData.life?.length ||
              policyData.health?.length ||
              policyData.motor?.length) ? (
            <>
              {renderPolicySection(
                'Life Insurance',
                '🛡️',
                policyData.life || [],
              )}
              {renderPolicySection(
                'Health Insurance',
                '🏥',
                policyData.health || [],
              )}
              {renderPolicySection(
                'Motor Insurance',
                '🚗',
                policyData.motor || [],
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyText}>No policies yet</Text>
              <Text style={styles.emptySubtext}>
                Add your insurance policies to get started
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('LifeInsurance')}
              >
                <Text style={styles.addButtonText}>Add Policy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  icon: { fontSize: 48, textAlign: 'center', marginVertical: 16 },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  loader: { marginTop: 40 },
  section: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  sectionIcon: { fontSize: 24, marginRight: 8 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  badgeContainer: {
    backgroundColor: '#4DB6AC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badge: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  policyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4DB6AC',
  },
  expiredCard: {
    borderLeftColor: '#FF6B6B',
    opacity: 0.7,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  policyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  insurerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  typeIcon: {
    fontSize: 24,
    marginLeft: 8,
  },
  policyNumber: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  policyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#000' },
  endDate: { fontSize: 12, color: '#4DB6AC', marginTop: 8 },
  expiredText: { color: '#FF6B6B' },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#139DA4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AllPoliciesScreen;

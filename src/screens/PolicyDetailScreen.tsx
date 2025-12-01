import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { getPolicyDetail, PolicyDetail } from '../services/policy';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';

type PolicyDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PolicyDetail'
>;

type PolicyDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'PolicyDetail'
>;

const PolicyDetailScreen: React.FC = () => {
  const navigation = useNavigation<PolicyDetailScreenNavigationProp>();
  const route = useRoute<PolicyDetailScreenRouteProp>();
  const { policyId } = route.params;

  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPolicyDetail();
  }, [policyId]);

  const loadPolicyDetail = async () => {
    try {
      setIsLoading(true);
      const data = await getPolicyDetail(policyId);
      setPolicy(data);
    } catch (error) {
      console.error('Failed to load policy detail:', error);
      Alert.alert('Error', 'Failed to load policy details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4DB6AC" />
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  if (!policy) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Policy not found</Text>
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back to Policies</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.icon}>
              {policy.insurance_type === 'HEALTH' ? '🏥' : '🛡️'}
            </Text>
            <Text style={styles.title}>{policy.name}</Text>
            <Text style={styles.subtitle}>
              {policy.insurance_type === 'HEALTH'
                ? 'Health Insurance'
                : 'Life Insurance'}
            </Text>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policy Information</Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.label}>Policy Number</Text>
                <Text style={styles.value}>{policy.policy_number}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Insurer</Text>
                <Text style={styles.value}>{policy.insurer_name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Uploaded</Text>
                <Text style={styles.value}>
                  {formatDate(policy.uploaded_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* Coverage Details */}
          {policy.coverage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Coverage Details</Text>
              <View style={styles.table}>
                <View style={styles.row}>
                  <Text style={styles.label}>Sum Assured</Text>
                  <Text style={styles.value}>
                    {formatCurrency(policy.coverage.sum_assured)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Premium Amount</Text>
                  <Text style={styles.value}>
                    {formatCurrency(policy.coverage.premium_amount)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Premium Frequency</Text>
                  <Text style={styles.value}>
                    {policy.coverage.premium_frequency || 'N/A'}
                  </Text>
                </View>
                {policy.coverage.issue_date && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Issue Date</Text>
                    <Text style={styles.value}>
                      {formatDate(policy.coverage.issue_date)}
                    </Text>
                  </View>
                )}
                {policy.coverage.start_date && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Start Date</Text>
                    <Text style={styles.value}>
                      {formatDate(policy.coverage.start_date)}
                    </Text>
                  </View>
                )}
                {policy.coverage.end_date && (
                  <View style={styles.row}>
                    <Text style={styles.label}>End Date</Text>
                    <Text style={styles.value}>
                      {formatDate(policy.coverage.end_date)}
                    </Text>
                  </View>
                )}
                {policy.coverage.maturity_date && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Maturity Date</Text>
                    <Text style={styles.value}>
                      {formatDate(policy.coverage.maturity_date)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Nominees */}
          {policy.nominees && policy.nominees.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nominees</Text>
              {policy.nominees.map((nominee, index) => (
                <View key={index} style={styles.nomineeCard}>
                  <Text style={styles.nomineeName}>{nominee.name}</Text>
                  <View style={styles.nomineeDetails}>
                    <Text style={styles.nomineeLabel}>Relationship:</Text>
                    <Text style={styles.nomineeValue}>
                      {nominee.relationship}
                    </Text>
                  </View>
                  <View style={styles.nomineeDetails}>
                    <Text style={styles.nomineeLabel}>Allocation:</Text>
                    <Text style={styles.nomineeValue}>
                      {nominee.allocation_percentage}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Health Details */}
          {policy.health_details && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Health Insurance Details</Text>
              <View style={styles.table}>
                {policy.health_details.policy_type && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Policy Type</Text>
                    <Text style={styles.value}>
                      {policy.health_details.policy_type}
                    </Text>
                  </View>
                )}
                {policy.health_details.room_rent_limit && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Room Rent Limit</Text>
                    <Text style={styles.value}>
                      {formatCurrency(policy.health_details.room_rent_limit)}
                    </Text>
                  </View>
                )}
                {policy.health_details.copay_percentage !== null && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Co-pay</Text>
                    <Text style={styles.value}>
                      {policy.health_details.copay_percentage}%
                    </Text>
                  </View>
                )}
                {policy.health_details.deductible_amount && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Deductible</Text>
                    <Text style={styles.value}>
                      {formatCurrency(policy.health_details.deductible_amount)}
                    </Text>
                  </View>
                )}
                <View style={styles.row}>
                  <Text style={styles.label}>Restoration Benefit</Text>
                  <Text style={styles.value}>
                    {policy.health_details.restoration_benefit ? 'Yes' : 'No'}
                  </Text>
                </View>
                {policy.health_details.no_claim_bonus !== null && (
                  <View style={styles.row}>
                    <Text style={styles.label}>No Claim Bonus</Text>
                    <Text style={styles.value}>
                      {policy.health_details.no_claim_bonus}%
                    </Text>
                  </View>
                )}
                {policy.health_details.waiting_period_days && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Waiting Period</Text>
                    <Text style={styles.value}>
                      {policy.health_details.waiting_period_days} days
                    </Text>
                  </View>
                )}
              </View>

              {/* Covered Members */}
              {policy.health_details.covered_members &&
                policy.health_details.covered_members.length > 0 && (
                  <View style={styles.membersSection}>
                    <Text style={styles.subsectionTitle}>Covered Members</Text>
                    {policy.health_details.covered_members.map(
                      (member, index) => (
                        <View key={index} style={styles.memberCard}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <View style={styles.memberDetails}>
                            <Text style={styles.memberLabel}>
                              Relationship:
                            </Text>
                            <Text style={styles.memberValue}>
                              {member.relationship}
                            </Text>
                          </View>
                          {member.date_of_birth && (
                            <View style={styles.memberDetails}>
                              <Text style={styles.memberLabel}>
                                Date of Birth:
                              </Text>
                              <Text style={styles.memberValue}>
                                {formatDate(member.date_of_birth)}
                              </Text>
                            </View>
                          )}
                          {member.sum_insured && (
                            <View style={styles.memberDetails}>
                              <Text style={styles.memberLabel}>
                                Sum Insured:
                              </Text>
                              <Text style={styles.memberValue}>
                                {formatCurrency(member.sum_insured)}
                              </Text>
                            </View>
                          )}
                        </View>
                      ),
                    )}
                  </View>
                )}
            </View>
          )}

          {/* Benefits */}
          {policy.benefits && policy.benefits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              {policy.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitCard}>
                  <Text style={styles.benefitName}>{benefit.benefit_name}</Text>
                  {benefit.benefit_amount && (
                    <Text style={styles.benefitAmount}>
                      {formatCurrency(benefit.benefit_amount)}
                    </Text>
                  )}
                  {benefit.description && (
                    <Text style={styles.benefitDescription}>
                      {benefit.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Exclusions */}
          {policy.exclusions && policy.exclusions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exclusions</Text>
              {policy.exclusions.map((exclusion, index) => (
                <View key={index} style={styles.exclusionCard}>
                  <Text style={styles.exclusionType}>
                    {exclusion.exclusion_type}
                  </Text>
                  <Text style={styles.exclusionDescription}>
                    {exclusion.description}
                  </Text>
                </View>
              ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { fontSize: 16, color: '#666' },
  backButton: { marginBottom: 16 },
  backButtonText: { fontSize: 16, color: '#4DB6AC', fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 64, marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  table: { width: '100%' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: { fontSize: 14, color: '#666', flex: 1 },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  nomineeCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4DB6AC',
  },
  nomineeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  nomineeDetails: { flexDirection: 'row', marginBottom: 4 },
  nomineeLabel: { fontSize: 14, color: '#666', width: 100 },
  nomineeValue: { fontSize: 14, color: '#000', flex: 1 },
  membersSection: { marginTop: 16 },
  memberCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  memberDetails: { flexDirection: 'row', marginBottom: 3 },
  memberLabel: { fontSize: 13, color: '#666', width: 110 },
  memberValue: { fontSize: 13, color: '#000', flex: 1 },
  benefitCard: {
    backgroundColor: '#E8F6F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4DB6AC',
  },
  benefitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  benefitAmount: {
    fontSize: 15,
    color: '#4DB6AC',
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: { fontSize: 14, color: '#666', marginTop: 4 },
  exclusionCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  exclusionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  exclusionDescription: { fontSize: 14, color: '#666' },
});

export default PolicyDetailScreen;

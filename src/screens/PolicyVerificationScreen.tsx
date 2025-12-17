import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ExtractedPolicyData, verifyPolicy } from '../services/policy';
import AppHeader from '../components/AppHeader';

type PolicyVerificationRouteProp = RouteProp<
  RootStackParamList,
  'PolicyVerification'
>;
type PolicyVerificationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PolicyVerification'
>;

const PolicyVerificationScreen: React.FC = () => {
  const navigation = useNavigation<PolicyVerificationNavigationProp>();
  const route = useRoute<PolicyVerificationRouteProp>();
  const { policyId, extractedData } = route.params;

  // State for editable fields
  const [insuranceType, setInsuranceType] = useState(
    extractedData.insurance_type || '',
  );
  const [policyNumber, setPolicyNumber] = useState(
    extractedData.policy_number || '',
  );
  const [sumAssured, setSumAssured] = useState(
    extractedData.coverage?.sum_assured?.toString() || '',
  );
  const [premiumAmount, setPremiumAmount] = useState(
    extractedData.coverage?.premium_amount?.toString() || '',
  );
  const [nomineeName, setNomineeName] = useState(
    extractedData.nominees?.[0]?.name || '',
  );
  const [nomineeRelationship, setNomineeRelationship] = useState(
    extractedData.nominees?.[0]?.relationship || '',
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    // Validate required fields
    if (!policyNumber.trim()) {
      Alert.alert('Error', 'Policy number is required');
      return;
    }

    if (!sumAssured.trim() || isNaN(Number(sumAssured))) {
      Alert.alert('Error', 'Please enter a valid sum assured amount');
      return;
    }

    if (!premiumAmount.trim() || isNaN(Number(premiumAmount))) {
      Alert.alert('Error', 'Please enter a valid premium amount');
      return;
    }

    try {
      setIsLoading(true);

      // Prepare verified data
      const verifiedData: ExtractedPolicyData = {
        ...extractedData,
        insurance_type: insuranceType,
        policy_number: policyNumber,
        coverage: {
          ...extractedData.coverage,
          sum_assured: Number(sumAssured),
          premium_amount: Number(premiumAmount),
        },
      };

      // Update nominees if provided
      if (nomineeName.trim()) {
        verifiedData.nominees = [
          {
            name: nomineeName,
            relationship: nomineeRelationship || 'Unknown',
            allocation_percentage:
              extractedData.nominees?.[0]?.allocation_percentage || 100,
          },
        ];
      }

      // Call verify API
      await verifyPolicy(policyId, verifiedData);

      Alert.alert('Success', 'Policy verified and saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to appropriate insurance screen based on type
            if (insuranceType === 'LIFE') {
              navigation.navigate('LifeInsurance');
            } else if (insuranceType === 'HEALTH') {
              navigation.navigate('HealthInsurance');
            } else {
              navigation.navigate('Home');
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to verify policy. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatInsuranceType = (type: string) => {
    if (type === 'LIFE') return 'Life Insurance';
    if (type === 'HEALTH') return 'Health Insurance';
    return type;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.pageTitle}>Verify Policy Details</Text>
          <Text style={styles.subtitle}>
            Please review and edit the extracted information
          </Text>

          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Insurance Type</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>
                  {formatInsuranceType(insuranceType)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Policy Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={policyNumber}
                onChangeText={setPolicyNumber}
                placeholder="Enter policy number"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Sum Assured (₹) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={sumAssured}
                onChangeText={setSumAssured}
                placeholder="Enter sum assured"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Premium Amount (₹) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={premiumAmount}
                onChangeText={setPremiumAmount}
                placeholder="Enter premium amount"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Nominee Details</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nominee Name</Text>
              <TextInput
                style={styles.input}
                value={nomineeName}
                onChangeText={setNomineeName}
                placeholder="Enter nominee name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={nomineeRelationship}
                onChangeText={setNomineeRelationship}
                placeholder="e.g., Spouse, Son, Daughter"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify & Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginVertical: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: '#E74C3C',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  readOnlyField: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#4DB6AC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A5D1CB',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PolicyVerificationScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  NativeModules,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import {
  uploadPolicy,
  getPolicies,
  getPolicyDetail,
  getExtractionStatus,
  PolicyListItem,
} from '../services/policy';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';

type MotorInsuranceScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MotorInsurance'
>;

const MotorInsuranceScreen: React.FC = () => {
  const navigation = useNavigation<MotorInsuranceScreenNavigationProp>();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [motorPolicies, setMotorPolicies] = useState<PolicyListItem[]>([]);
  const [unprocessedPolicies, setUnprocessedPolicies] = useState<
    PolicyListItem[]
  >([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);
  const [pollingPolicyIds, setPollingPolicyIds] = useState<Set<number>>(
    new Set(),
  );
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPolicies = async () => {
    try {
      setIsLoadingPolicies(true);
      const data = await getPolicies('MOTOR');
      setMotorPolicies(data.motor || []);
      setUnprocessedPolicies(data.unprocessed || []);

      // Start polling for any policies with PENDING or PROCESSING status
      const needsPolling = (data.unprocessed || []).filter(
        p =>
          p.ai_extraction_status === 'PENDING' ||
          p.ai_extraction_status === 'PROCESSING',
      );
      if (needsPolling.length > 0) {
        const ids = new Set(needsPolling.map(p => p.id));
        setPollingPolicyIds(ids);
        startPolling(ids);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
      Alert.alert('Error', 'Failed to load policies');
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  const startPolling = (policyIds: Set<number>) => {
    policyIds.forEach(id => {
      const interval = setInterval(async () => {
        try {
          const status = await getExtractionStatus(id);
          if (
            status.ai_extraction_status === 'COMPLETED' ||
            status.ai_extraction_status === 'FAILED'
          ) {
            clearInterval(interval);
            setPollingPolicyIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
            loadPolicies(); // Refresh list
          }
        } catch (error) {
          console.error(`Failed to poll status for policy ${id}:`, error);
        }
      }, 30000); // Poll every 30 seconds
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPolicies();
      setShowUploadForm(false);
    }, []),
  );

  const handleFilePick = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Unsupported',
        'PDF picker is currently supported only on Android in this build.',
      );
      return;
    }

    const nativeModule = (NativeModules as any).FilePickerModule;

    if (!nativeModule) {
      Alert.alert(
        'Error',
        'File picker native module not available. Make sure native dependency is installed and the app was rebuilt.',
      );
      return;
    }

    try {
      if (typeof nativeModule?.showFilePicker === 'function') {
        const options = { title: 'Select PDF' };
        (nativeModule.showFilePicker(options) as Promise<any>)
          .then((response: any) => {
            if (!response) return;
            if (response.didCancel) return;
            const uri = response.uri;
            const name = response.fileName || (uri && uri.split('/').pop());
            const type = response.type || 'application/pdf';
            if (uri && name) {
              setSelectedFile({ uri, type, name });
            } else {
              Alert.alert('Error', 'Could not read selected file');
            }
          })
          .catch((err: any) => {
            console.error('FilePicker error:', err);
            const errMsg = String(err?.message || err || '');
            if (
              errMsg.toLowerCase().includes('permission') ||
              errMsg.toLowerCase().includes('user rejected')
            ) {
              Alert.alert(
                'Permission required',
                'Storage permission was denied. To pick a file, enable storage permission in app settings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Open Settings',
                    onPress: () => {
                      Linking.openSettings().catch(() => {
                        Alert.alert('Error', 'Unable to open settings');
                      });
                    },
                  },
                ],
              );
            } else {
              Alert.alert('Error', 'Failed to pick file');
            }
          });
      } else {
        Alert.alert('Error', 'File picker not supported by native module');
      }
    } catch (err) {
      console.error('handleFilePick error:', err);
      Alert.alert('Error', 'Unexpected error while opening file picker');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter vehicle insurance name');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a PDF file');
      return;
    }

    try {
      setIsLoading(true);
      const response = await uploadPolicy(name, selectedFile);

      Alert.alert(
        'Success',
        'Motor insurance policy uploaded! AI is extracting details in the background. You can verify once complete.',
        [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              setSelectedFile(null);
              setShowUploadForm(false);
              loadPolicies();
            },
          },
        ],
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to upload motor insurance policy. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPolicy = async (policy: PolicyListItem) => {
    if (
      policy.ai_extraction_status === 'PENDING' ||
      policy.ai_extraction_status === 'PROCESSING'
    ) {
      Alert.alert(
        'Please wait',
        'AI is still extracting policy details. This usually takes 1-2 minutes.',
      );
      return;
    }

    if (policy.ai_extraction_status === 'FAILED') {
      Alert.alert(
        'Error',
        'Failed to extract policy details. Please try uploading again.',
      );
      return;
    }

    try {
      const status = await getExtractionStatus(policy.id);
      if (status.extracted_data) {
        navigation.navigate('PolicyVerification', {
          policyId: policy.id,
          extractedData: status.extracted_data,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load extracted data');
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '---';
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const renderUnprocessedPolicyCard = (policy: PolicyListItem) => {
    const isProcessing =
      policy.ai_extraction_status === 'PENDING' ||
      policy.ai_extraction_status === 'PROCESSING';
    const isFailed = policy.ai_extraction_status === 'FAILED';
    const isCompleted = policy.ai_extraction_status === 'COMPLETED';

    return (
      <View key={policy.id} style={styles.unprocessedCard}>
        <View style={styles.policyHeader}>
          <Text style={styles.policyName}>{policy.name}</Text>
          {isProcessing && (
            <View style={styles.processingBadge}>
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
          {isFailed && (
            <View style={styles.failedBadge}>
              <Text style={styles.failedText}>Failed</Text>
            </View>
          )}
        </View>
        <Text style={styles.uploadDate}>
          Uploaded: {new Date(policy.uploaded_at).toLocaleDateString('en-IN')}
        </Text>

        {isCompleted && !policy.is_verified_by_user && (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleVerifyPolicy(policy)}
          >
            <Text style={styles.verifyButtonText}>Verify Details →</Text>
          </TouchableOpacity>
        )}

        {isFailed && (
          <Text style={styles.errorText}>
            Failed to extract details. Please upload again.
          </Text>
        )}
      </View>
    );
  };

  const renderPolicyCard = (policy: PolicyListItem) => {
    return (
      <TouchableOpacity
        key={policy.id}
        style={styles.policyCard}
        onPress={() =>
          navigation.navigate('PolicyDetail', { policyId: policy.id })
        }
      >
        <View style={styles.policyCardHeader}>
          <Text style={styles.policyName}>{policy.name}</Text>
          <Text style={styles.policyType}>Motor Insurance</Text>
        </View>

        <View style={styles.policyDetailRow}>
          <Text style={styles.policyLabel}>Insurance Company</Text>
          <Text style={styles.policyValue}>{policy.insurer_name || '---'}</Text>
        </View>

        <View style={styles.policyDetailRow}>
          <Text style={styles.policyLabel}>Policy Number</Text>
          <Text style={styles.policyValue}>
            {policy.policy_number || '---'}
          </Text>
        </View>

        <View style={styles.policyDetailRow}>
          <Text style={styles.policyLabel}>Premium</Text>
          <Text style={styles.policyValue}>
            {formatCurrency(policy.premium_amount)}
          </Text>
        </View>

        <View style={styles.policyDetailRow}>
          <Text style={styles.policyLabel}>IDV / Cover</Text>
          <Text style={styles.policyValue}>
            {formatCurrency(policy.sum_assured)}
          </Text>
        </View>

        {policy.end_date && (
          <View style={styles.policyDetailRow}>
            <Text style={styles.policyLabel}>Valid Until</Text>
            <Text
              style={[
                styles.policyValue,
                policy.is_expired && styles.expiredText,
              ]}
            >
              {new Date(policy.end_date).toLocaleDateString('en-IN')}
              {policy.is_expired && ' (Expired)'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Motor Insurance</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowUploadForm(!showUploadForm)}
          >
            <Text style={styles.addButtonText}>
              {showUploadForm ? '− Cancel' : '+ Add Policy'}
            </Text>
          </TouchableOpacity>
        </View>

        {showUploadForm && (
          <View style={styles.uploadFormCard}>
            <Text style={styles.formTitle}>Upload Motor Insurance Policy</Text>

            <Text style={styles.label}>Vehicle Insurance Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Car Insurance"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Policy Document (PDF)</Text>
            <TouchableOpacity
              style={styles.filePickerButton}
              onPress={handleFilePick}
            >
              <Text style={styles.filePickerText}>
                {selectedFile ? selectedFile.name : 'Choose PDF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Upload Policy</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Unprocessed Policies */}
        {unprocessedPolicies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Verification</Text>
            {unprocessedPolicies.map(renderUnprocessedPolicyCard)}
          </View>
        )}

        {/* Verified Motor Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Motor Insurance Policies</Text>
          {isLoadingPolicies ? (
            <ActivityIndicator size="large" color="#139DA4" />
          ) : motorPolicies.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No motor insurance policies yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Upload your vehicle insurance policy to get started
              </Text>
            </View>
          ) : (
            motorPolicies.map(renderPolicyCard)
          )}
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#139DA4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadFormCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  filePickerButton: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  filePickerText: {
    color: '#666',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#139DA4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  unprocessedCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  policyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  processingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  failedBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  failedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  uploadDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 8,
  },
  policyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  policyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  policyType: {
    fontSize: 12,
    color: '#139DA4',
    fontWeight: '500',
  },
  policyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  policyLabel: {
    fontSize: 14,
    color: '#666',
  },
  policyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  expiredText: {
    color: '#f44336',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default MotorInsuranceScreen;

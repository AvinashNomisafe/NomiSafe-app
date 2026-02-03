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

type HealthInsuranceScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'HealthInsurance'
>;

const HealthInsuranceScreen: React.FC = () => {
  const navigation = useNavigation<HealthInsuranceScreenNavigationProp>();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [healthPolicies, setHealthPolicies] = useState<PolicyListItem[]>([]);
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
      const data = await getPolicies('HEALTH');
      setHealthPolicies(data.health);
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
      Alert.alert('Error', 'Please enter insurance name');
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
        'Policy uploaded! AI is extracting details in the background. You can verify once complete.',
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
        'Failed to upload insurance policy. Please try again.';
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

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `₹${num.toLocaleString('en-IN')}`;
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

        {isProcessing && (
          <Text style={styles.statusText}>
            AI is extracting policy details. This may take 1-2 minutes.
          </Text>
        )}

        {isFailed && (
          <Text style={styles.errorText}>
            Failed to extract details. Please try uploading again.
          </Text>
        )}
      </View>
    );
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
          <Text style={styles.policyName}>{policy.name}</Text>
          {policy.is_expired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>Expired</Text>
            </View>
          )}
        </View>
        <Text style={styles.policyNumber}>
          Policy No: {policy.policy_number}
        </Text>
        <Text style={styles.insurer}>{policy.insurer_name}</Text>
        <View style={styles.policyDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sum Assured</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(policy.sum_assured)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Premium</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(policy.premium_amount)}
            </Text>
          </View>
        </View>
        {policy.end_date && (
          <Text style={styles.endDate}>
            Valid until: {new Date(policy.end_date).toLocaleDateString('en-IN')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (showUploadForm) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader />
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowUploadForm(false)}
            >
              <Text style={styles.backButtonText}>← Back to Policies</Text>
            </TouchableOpacity>

            <Text style={styles.icon}>🏥</Text>
            <Text style={styles.pageTitle}>Upload Health Insurance</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Insurance Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter insurance name"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Policy Document (PDF)</Text>
              <TouchableOpacity
                style={[styles.filePicker, selectedFile && styles.fileSelected]}
                onPress={handleFilePick}
              >
                <Text style={styles.filePickerText}>
                  {selectedFile ? selectedFile.name : 'Select PDF File'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Upload Policy</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>🏥</Text>
          <Text style={styles.pageTitle}>Health Insurance</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowUploadForm(true)}
          >
            <Text style={styles.addButtonText}>+ Add Policy</Text>
          </TouchableOpacity>

          {isLoadingPolicies ? (
            <ActivityIndicator
              size="large"
              color="#4DB6AC"
              style={styles.loader}
            />
          ) : (
            <>
              {unprocessedPolicies.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pending Verification</Text>
                  {unprocessedPolicies.map(renderUnprocessedPolicyCard)}
                </View>
              )}

              {healthPolicies.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Active Policies</Text>
                  {healthPolicies.map(renderPolicyCard)}
                </View>
              )}

              {healthPolicies.length === 0 &&
                unprocessedPolicies.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📄</Text>
                    <Text style={styles.emptyText}>
                      No health insurance policies yet
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Click "Add Policy" to upload your first health insurance
                      policy
                    </Text>
                  </View>
                )}
            </>
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
  addButton: {
    backgroundColor: '#4DB6AC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loader: { marginTop: 40 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
  unprocessedCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
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
    flex: 1,
  },
  processingBadge: {
    flexDirection: 'row',
    backgroundColor: '#FFA726',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  processingText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  failedBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  failedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  expiredBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  expiredText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  uploadDate: { fontSize: 14, color: '#666', marginBottom: 12 },
  verifyButton: {
    backgroundColor: '#4DB6AC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statusText: {
    fontSize: 13,
    color: '#FFA726',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  policyNumber: { fontSize: 14, color: '#666', marginBottom: 4 },
  insurer: { fontSize: 14, color: '#666', marginBottom: 12 },
  policyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#000' },
  endDate: { fontSize: 12, color: '#4DB6AC', marginTop: 8 },
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
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4DB6AC',
    fontWeight: '600',
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
  label: { fontSize: 16, color: '#333', marginBottom: 8, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: '#000',
  },
  filePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
  },
  fileSelected: { borderColor: '#4DB6AC', backgroundColor: '#E8F6F5' },
  filePickerText: { color: '#666', fontSize: 16, textAlign: 'center' },
  button: {
    backgroundColor: '#4DB6AC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#A5D1CB' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default HealthInsuranceScreen;

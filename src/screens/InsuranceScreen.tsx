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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadPolicy, getPolicies, Policy } from '../services/policy';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';

const InsuranceScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingPolicies, setIsFetchingPolicies] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setIsFetchingPolicies(true);
      const data = await getPolicies();
      setPolicies(data);
      // If no policies exist, show the form by default
      if (data.length === 0) {
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      Alert.alert('Error', 'Failed to load policies');
    } finally {
      setIsFetchingPolicies(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPolicies();
  };

  const handleFilePick = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Unsupported',
        'PDF picker is currently supported only on Android in this build.',
      );
      return;
    }

    // Use only our SAF-based native module (no fallback needed)
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
        // Promise-based API (our SAF module)
        const options = { title: 'Select PDF' };
        (nativeModule.showFilePicker(options) as Promise<any>)
          .then((response: any) => {
            if (!response) return;
            if (response.didCancel) return;
            // Our Kotlin module returns fileName, uri, type, size
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
      await uploadPolicy(name, selectedFile);
      Alert.alert('Success', 'Insurance policy uploaded successfully');

      // Reset form
      setName('');
      setSelectedFile(null);
      setShowForm(false);

      // Refresh policies list
      fetchPolicies();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Error',
        'Failed to upload insurance policy. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPolicyCard = (policy: Policy) => (
    <View key={policy.id} style={styles.policyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>📄</Text>
        <View style={styles.cardHeaderText}>
          <Text style={styles.policyName}>{policy.name}</Text>
          <Text style={styles.uploadDate}>
            Uploaded: {formatDate(policy.uploaded_at)}
          </Text>
        </View>
      </View>
      {policy.benefits && (
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsLabel}>Benefits:</Text>
          <Text style={styles.benefitsText} numberOfLines={3}>
            {policy.benefits}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.viewDetailsButton}
        onPress={() => {
          Alert.alert(
            'Policy Details',
            policy.benefits || 'No benefits extracted yet',
          );
        }}
      >
        <Text style={styles.viewDetailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPoliciesList = () => (
    <View style={styles.policiesContainer}>
      <View style={styles.header}>
        <Text style={styles.icon}>🏥</Text>
        <Text style={styles.pageTitle}>My Insurance Policies</Text>
        <Text style={styles.policyCount}>
          {policies.length} {policies.length === 1 ? 'Policy' : 'Policies'}
        </Text>
      </View>

      <ScrollView
        style={styles.policiesList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {policies.map(renderPolicyCard)}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );

  const renderUploadForm = () => (
    <View style={styles.content}>
      <Text style={styles.icon}>🏥</Text>
      <Text style={styles.pageTitle}>Insurance</Text>

      <View style={styles.form}>
        <Text style={styles.title}>Upload Insurance Policy</Text>

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

        {policies.length > 0 && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowForm(false);
              setName('');
              setSelectedFile(null);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isFetchingPolicies) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerContent]}
        edges={['bottom']}
      >
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4DB6AC" />
          <Text style={styles.loadingText}>Loading policies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      {showForm ? (
        <ScrollView style={styles.container}>{renderUploadForm()}</ScrollView>
      ) : (
        renderPoliciesList()
      )}

      {!showForm && policies.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
          <Text style={styles.fabText}>+ Add Policy</Text>
        </TouchableOpacity>
      )}
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: { padding: 20 },
  policiesContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  policiesList: {
    flex: 1,
    padding: 16,
  },
  policyCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  policyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  uploadDate: {
    fontSize: 12,
    color: '#666',
  },
  benefitsSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  benefitsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  benefitsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  viewDetailsButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E8F6F5',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  viewDetailsText: {
    color: '#4DB6AC',
    fontSize: 14,
    fontWeight: '600',
  },
  policyCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  bottomSpacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4DB6AC',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: { fontSize: 48, textAlign: 'center', marginVertical: 16 },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
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
  cancelButton: {
    marginTop: 12,
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
});

export default InsuranceScreen;

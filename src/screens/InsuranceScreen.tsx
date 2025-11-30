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
  Platform,
  NativeModules,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { uploadPolicy } from '../services/policy';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';

type InsuranceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Insurance'
>;

const InsuranceScreen: React.FC = () => {
  const navigation = useNavigation<InsuranceScreenNavigationProp>();
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await uploadPolicy(name, selectedFile);

      // Navigate to verification screen with extracted data
      navigation.navigate('PolicyVerification', {
        policyId: response.id,
        extractedData: response.extracted_data,
      });

      // Reset form
      setName('');
      setSelectedFile(null);
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.container}>
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
          </View>
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
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
});

export default InsuranceScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  NativeModules,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { RootStackParamList } from '../types/navigation';
import { saveNominee } from '../services/nominee';

type NomineeDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  'NomineeDetails'
>;

const NomineeDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NomineeDetailsNavigationProp>();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [idProofType, setIdProofType] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFilePick = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Unsupported',
        'File picker is currently supported only on Android in this build.',
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
        const options = { title: 'Select Document' };
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
      }
    } catch (err) {
      console.error('handleFilePick error:', err);
      Alert.alert('Error', 'Unexpected error while opening file picker');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter nominee name');
      return;
    }

    try {
      setIsSaving(true);
      await saveNominee({
        name: name.trim(),
        relationship: relationship.trim() || undefined,
        contact_details: contactDetails.trim() || undefined,
        id_proof_type: idProofType.trim() || undefined,
        aadhaar_number: aadhaarNumber.trim() || undefined,
        id_proof_file: selectedFile,
      });

      Alert.alert('Success', 'Nominee saved successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Failed to save nominee:', error);
      Alert.alert('Error', 'Failed to save nominee');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Nominee Details</Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Enter Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Select Relation</Text>
            <TextInput
              style={styles.input}
              value={relationship}
              onChangeText={setRelationship}
              placeholder="Select"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Enter Contact Details</Text>
            <TextInput
              style={styles.input}
              value={contactDetails}
              onChangeText={setContactDetails}
              placeholder="Enter details"
              placeholderTextColor="#999"
            />

            <View style={styles.addMoreSpacer} />

            <Text style={styles.label}>Select ID Proof</Text>
            <TextInput
              style={styles.input}
              value={idProofType}
              onChangeText={setIdProofType}
              placeholder="Select"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Enter Aadhaar Number</Text>
            <TextInput
              style={styles.input}
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              placeholder="Enter number"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={12}
            />

            <View style={styles.uploadRow}>
              <Text style={styles.uploadLabel}>Upload file (Optional)</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleFilePick}
              >
                <Text style={styles.uploadButtonText}>UPLOAD</Text>
              </TouchableOpacity>
            </View>
            {selectedFile ? (
              <Text style={styles.fileName}>{selectedFile.name}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>SAVE</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#777',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    color: '#1a1a1a',
  },
  addMoreSpacer: {
    height: 6,
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  uploadLabel: {
    fontSize: 12,
    color: '#777',
  },
  uploadButton: {
    backgroundColor: '#139DA4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  fileName: {
    marginTop: 8,
    fontSize: 12,
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#139DA4',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default NomineeDetailsScreen;

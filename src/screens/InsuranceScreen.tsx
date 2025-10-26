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
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadPolicy } from '../services/policy';

const InsuranceScreen = () => {
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilePick = async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
    });

    if (result.assets && result.assets[0]) {
      const file = result.assets[0];
      if (file.uri && file.type && file.fileName) {
        setSelectedFile({
          uri: file.uri,
          type: file.type,
          name: file.fileName,
        });
      }
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

  return (
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
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginVertical: 16,
  },
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
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
  fileSelected: {
    borderColor: '#4DB6AC',
    backgroundColor: '#E8F6F5',
  },
  filePickerText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4DB6AC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A5D1CB',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InsuranceScreen;

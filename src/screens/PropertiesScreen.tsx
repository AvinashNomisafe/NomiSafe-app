import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  NativeModules,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import {
  getProperties,
  getPropertyDownloadUrl,
  uploadProperty,
  PropertyItem,
} from '../services/property';

const PropertiesScreen = () => {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProperties();
      setShowForm(false);
    }, []),
  );

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
        const options = { title: 'Select PDF' };
        (nativeModule.showFilePicker(options) as Promise<any>)
          .then((response: any) => {
            if (!response) return;
            if (response.didCancel) return;
            const uri = response.uri;
            const fileName = response.fileName || (uri && uri.split('/').pop());
            const type = response.type || 'application/pdf';
            if (uri && fileName) {
              setSelectedFile({ uri, type, name: fileName });
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
      Alert.alert('Error', 'Please enter property name');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select property papers (PDF)');
      return;
    }

    try {
      setIsSaving(true);
      await uploadProperty(name.trim(), selectedFile);
      setName('');
      setSelectedFile(null);
      setShowForm(false);
      await loadProperties();
    } catch (error) {
      console.error('Failed to upload property:', error);
      Alert.alert('Error', 'Failed to upload property');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDocument = async (property: PropertyItem) => {
    try {
      console.log('Fetching download URL for property:', property.id);
      const url = await getPropertyDownloadUrl(property.id);
      console.log('Download URL received:', url);

      if (!url) {
        Alert.alert('Error', 'No document URL available');
        return;
      }

      // Open the URL directly - canOpenURL often returns false on Android even for valid URLs
      const opened = await Linking.openURL(url);
      console.log('URL opened:', opened);
    } catch (error: any) {
      console.error('Failed to open property document:', error);
      Alert.alert(
        'Cannot Open Document',
        'Unable to open this document. Please make sure you have a PDF viewer or browser installed.',
      );
    }
  };

  if (showForm) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader />
        <ScrollView style={styles.container}>
          <View style={styles.formContent}>
            <Text style={styles.formTitle}>Add Property Details</Text>

            <View style={styles.formCard}>
              <Text style={styles.label}>Name of the property</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter property name"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Papers of the property (PDF)</Text>
              <TouchableOpacity
                style={styles.filePicker}
                onPress={handleFilePick}
              >
                <Text style={styles.filePickerText}>
                  {selectedFile ? selectedFile.name : 'Choose PDF'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
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
          </View>
        </ScrollView>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          properties.length > 0 ? styles.listContent : styles.content
        }
      >
        {properties.length > 0 ? (
          <Text style={styles.title}>Properties</Text>
        ) : (
          <>
            <Text style={styles.icon}>🏠</Text>
            <Text style={styles.title}>Properties</Text>
          </>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" color="#4DB6AC" />
        ) : properties.length === 0 ? (
          <View style={styles.emptyState}>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.emptyButtonText}>Add Property Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {properties.map(property => (
              <TouchableOpacity
                key={property.id}
                style={styles.card}
                onPress={() => handleOpenDocument(property)}
              >
                <Text style={styles.cardTitle}>{property.name}</Text>
                <Text style={styles.cardSubtitle}>
                  Uploaded:{' '}
                  {new Date(property.uploaded_at).toLocaleDateString('en-IN')}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.addMoreButtonText}>Add Property</Text>
            </TouchableOpacity>
          </View>
        )}
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
  },
  emptyButton: {
    backgroundColor: '#139DA4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    width: '100%',
  },
  addMoreButton: {
    backgroundColor: '#139DA4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addMoreButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  formContent: {
    padding: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4DB6AC',
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  filePicker: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  filePickerText: {
    color: '#666',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#139DA4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default PropertiesScreen;

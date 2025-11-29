import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useFallDetection } from '../contexts/FallDetectionContext';
import {
  fallDetectionService,
  EmergencyContact,
} from '../services/FallDetectionService';

export const FallDetectionSettingsScreen: React.FC = () => {
  const { isMonitoring, startMonitoring, stopMonitoring } = useFallDetection();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const loadedContacts = await fallDetectionService.getContacts();
      setContacts(loadedContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleToggleFallDetection = async (value: boolean) => {
    if (value) {
      const success = await startMonitoring();
      if (!success) {
        Alert.alert(
          'Permission Required',
          'Fall detection requires motion sensor and notification permissions.',
        );
      }
    } else {
      await stopMonitoring();
    }
  };

  const handleAddContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString(),
    };

    try {
      await fallDetectionService.saveEmergencyContact(newContact);
      await loadContacts();
      setShowAddContact(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save emergency contact');
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await fallDetectionService.removeEmergencyContact(contactId);
              await loadContacts();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove contact');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Fall Detection</Text>
        <Text style={styles.description}>
          Automatically detect emergency falls and alert your contacts
        </Text>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Enable Fall Detection</Text>
          <Switch
            value={isMonitoring}
            onValueChange={handleToggleFallDetection}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isMonitoring ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {isMonitoring && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>✅ Monitoring Active</Text>
            <Text style={styles.statusSubtext}>
              We're monitoring for falls in the background
            </Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • Detects free-fall, impact, and stillness patterns{'\n'}• Shows
            30-second countdown before alerting{'\n'}• Sends location to
            emergency contacts{'\n'}• Works even when phone is in pocket
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>Emergency Contacts</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddContact(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No emergency contacts added yet
            </Text>
            <Text style={styles.emptySubtext}>
              Add contacts who should be notified in case of a fall
            </Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactPhone}>{item.phone}</Text>
                  {item.relationship && (
                    <Text style={styles.contactRelation}>
                      {item.relationship}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveContact(item.id)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <AddContactModal
        visible={showAddContact}
        onAdd={handleAddContact}
        onCancel={() => setShowAddContact(false)}
      />
    </ScrollView>
  );
};

const AddContactModal: React.FC<{
  visible: boolean;
  onAdd: (contact: Omit<EmergencyContact, 'id'>) => void;
  onCancel: () => void;
}> = ({ visible, onAdd, onCancel }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Name and phone number are required');
      return;
    }

    onAdd({
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
    });

    // Reset form
    setName('');
    setPhone('');
    setRelationship('');
  };

  const handleCancel = () => {
    setName('');
    setPhone('');
    setRelationship('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Emergency Contact</Text>

          <TextInput
            style={styles.input}
            placeholder="Name *"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Relationship (optional)"
            value={relationship}
            onChangeText={setRelationship}
            placeholderTextColor="#999"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  statusText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 16,
  },
  statusSubtext: {
    color: '#2e7d32',
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactRelation: {
    fontSize: 12,
    color: '#999',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

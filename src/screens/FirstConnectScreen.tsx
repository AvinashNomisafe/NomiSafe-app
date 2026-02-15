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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import {
  getFirstConnects,
  createFirstConnect,
  deleteFirstConnect,
  FirstConnectItem,
} from '../services/firstConnect';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

type ViewState = 'loading' | 'empty' | 'list' | 'form';

const FirstConnectScreen = () => {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [contacts, setContacts] = useState<FirstConnectItem[]>([]);
  const [remaining, setRemaining] = useState(3);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const loadContacts = async () => {
    try {
      setViewState('loading');
      const data = await getFirstConnects();
      setContacts(data.first_connects);
      setRemaining(data.remaining);
      setViewState(data.first_connects.length > 0 ? 'list' : 'empty');
    } catch (error) {
      console.error('Failed to load first connects:', error);
      Alert.alert('Error', 'Failed to load contacts');
      setViewState('empty');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, []),
  );

  const handleAddPress = () => {
    setName('');
    setPhoneNumber('');
    setViewState('form');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a mobile number');
      return;
    }

    try {
      setIsSaving(true);
      await createFirstConnect(name.trim(), phoneNumber.trim());
      Alert.alert('Success', 'Contact added successfully');
      setName('');
      setPhoneNumber('');
      await loadContacts();
    } catch (error: any) {
      console.error('Failed to save contact:', error);
      const message = error?.response?.data?.error || 'Failed to save contact';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFirstConnect(id);
              setMenuOpenId(null);
              await loadContacts();
            } catch (error) {
              console.error('Failed to delete contact:', error);
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ],
    );
  };

  const toggleMenu = (id: number) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  // Empty State
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/icons/firstConnectIcon.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />

      <Text style={styles.emptyDescription}>
        Your <Text style={styles.accentText}>First Connect</Text>
      </Text>
      <Text style={styles.emptyDescription}>
        This is the person Nomisafe will notify first during an{' '}
        <Text style={styles.emergencyText}>emergency.</Text>
      </Text>
      <Text style={styles.emptyDescription}>
        Add someone you trust family, friend, or guardian.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAddPress}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>+ADD FIRST CONNECT</Text>
      </TouchableOpacity>
    </View>
  );

  // Form State
  const renderFormState = () => (
    <ScrollView style={styles.formScrollView}>
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Enter Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Enter Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter mobile number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        {remaining > 1 && contacts.length < 2 && (
          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <Text style={styles.addMoreButtonText}>+ADD MORE</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.infoText}>
          For better security, we recommend adding at least 3 trusted contacts.
        </Text>
        <Text style={styles.infoText}>
          Nomisafe will alert them instantly in case of an emergency.
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // List State
  const renderListState = () => (
    <ScrollView style={styles.listScrollView}>
      <View style={styles.listContainer}>
        {contacts.map(contact => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Name :</Text>
              <Text style={styles.contactValue}>{contact.name}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Mobile Number :</Text>
              <Text style={styles.contactValue}>{contact.phone_number}</Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => toggleMenu(contact.id)}
            >
              <Icon name="more-vert" size={24} color="#666" />
            </TouchableOpacity>

            {menuOpenId === contact.id && (
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleDelete(contact.id)}
                >
                  <Text style={styles.menuItemTextDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {remaining > 0 && (
          <>
            <Text style={styles.pendingText}>
              {remaining} First Connect Pending
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAddPress}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>+ADD MORE</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (viewState) {
      case 'loading':
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.background.main} />
          </View>
        );
      case 'empty':
        return renderEmptyState();
      case 'form':
        return renderFormState();
      case 'list':
        return renderListState();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />

      <View style={styles.content}>{renderContent()}</View>

      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  screenTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: spacing.xl,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  emptyDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  accentText: {
    color: colors.background.main,
    fontWeight: '500',
  },
  emergencyText: {
    color: '#E57373',
  },

  // Form State
  formScrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    backgroundColor: '#fff',
  },
  addMoreButton: {
    backgroundColor: colors.background.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  addMoreButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: colors.background.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },

  // List State
  listScrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  contactCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    position: 'relative',
    width: '100%',
  },
  contactInfo: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  contactLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    width: 120,
  },
  contactValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  menuButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
  },
  menuDropdown: {
    position: 'absolute',
    top: 40,
    right: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  menuItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  menuItemTextDelete: {
    color: '#E57373',
    fontSize: typography.fontSize.sm,
  },
  pendingText: {
    color: '#E57373',
    fontSize: typography.fontSize.sm,
    textAlign: 'right',
    marginBottom: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },

  // Buttons
  primaryButton: {
    backgroundColor: colors.background.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.lg,
    width: '90%',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});

export default FirstConnectScreen;

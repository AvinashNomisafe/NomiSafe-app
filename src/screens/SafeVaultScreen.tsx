import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { RootStackParamList } from '../types/navigation';
import { AppNominee, getNominee } from '../services/nominee';

type SafeVaultNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SafeVault'
>;

const SafeVaultScreen = () => {
  const navigation = useNavigation<SafeVaultNavigationProp>();
  const [nominee, setNominee] = useState<AppNominee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadNominee = async () => {
    try {
      setIsLoading(true);
      const data = await getNominee();
      setNominee(data);
    } catch (error) {
      console.error('Failed to load nominee:', error);
      Alert.alert('Error', 'Failed to load nominee details');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNominee();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#4DB6AC"
            style={styles.loader}
          />
        ) : nominee ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nominee Details</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{nominee.name}</Text>
            </View>
            {nominee.relationship ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Relationship</Text>
                <Text style={styles.infoValue}>{nominee.relationship}</Text>
              </View>
            ) : null}
            {nominee.contact_details ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contact Details</Text>
                <Text style={styles.infoValue}>{nominee.contact_details}</Text>
              </View>
            ) : null}
            {nominee.id_proof_type ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID Proof</Text>
                <Text style={styles.infoValue}>{nominee.id_proof_type}</Text>
              </View>
            ) : null}
            {nominee.aadhaar_number ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Aadhaar</Text>
                <Text style={styles.infoValue}>{nominee.aadhaar_number}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('NomineeDetails')}
            >
              <Text style={styles.addButtonText}>+ Add Nominee</Text>
            </TouchableOpacity>
            <Text style={styles.subtitle}>
              Securely store your nominee details for future claims.
            </Text>
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
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#139DA4',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  subtitle: {
    fontSize: 13,
    color: '#7b7b7b',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
});

export default SafeVaultScreen;

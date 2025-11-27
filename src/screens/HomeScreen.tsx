import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  NativeModules,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { runAPITest } from '../services/apiTest';
import { ENVIRONMENT, API_BASE_URL } from '../config/api';
import AppHeader from '../components/AppHeader';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  const handleTestAPI = async () => {
    setIsTestingAPI(true);
    try {
      const results = await runAPITest();

      // Show alert with results
      const successCount = Object.values(results.endpoints).filter(
        r => r.status === 'success' || r.statusCode,
      ).length;
      const totalCount = Object.keys(results.endpoints).length;

      Alert.alert(
        'API Test Results',
        `Environment: ${ENVIRONMENT}\nBase URL: ${API_BASE_URL}\n\nEndpoints: ${successCount}/${totalCount} reachable\n\nCheck console for detailed results.`,
        [{ text: 'OK' }],
      );
    } catch (error) {
      Alert.alert(
        'API Test Failed',
        'Could not connect to server. Check console for details.',
      );
      console.error('API test error:', error);
    } finally {
      setIsTestingAPI(false);
    }
  };

  const handleTestShakeAlert = () => {
    if (Platform.OS === 'android') {
      NativeModules.ShakeServiceModule?.triggerTestAlert();
    }
  };

  const menuItems = [
    {
      id: 1,
      title: 'My Policy',
      icon: '📋',
      route: 'MyPolicy' as keyof RootStackParamList,
    },
    {
      id: 2,
      title: 'Insurance',
      icon: '🏥',
      route: 'Insurance' as keyof RootStackParamList,
    },
    {
      id: 3,
      title: 'Properties',
      icon: '🏠',
      route: 'Properties' as keyof RootStackParamList,
    },
    {
      id: 4,
      title: 'Tutorials',
      icon: '📚',
      route: 'Tutorials' as keyof RootStackParamList,
    },
  ];

  const renderMenuGrid = () => (
    <View style={styles.menuGrid}>
      {menuItems.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuItem}
          onPress={() => navigation.navigate(item.route as any)}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text style={styles.menuTitle}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        {/* API Test Section */}
        <View style={styles.apiTestSection}>
          <View style={styles.apiInfoBox}>
            <Text style={styles.apiInfoLabel}>Environment:</Text>
            <Text style={styles.apiInfoValue}>{ENVIRONMENT.toUpperCase()}</Text>
          </View>
          <View style={styles.apiInfoBox}>
            <Text style={styles.apiInfoLabel}>API URL:</Text>
            <Text style={styles.apiInfoValueSmall}>{API_BASE_URL}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.testAPIButton,
              isTestingAPI && styles.testAPIButtonDisabled,
            ]}
            onPress={handleTestAPI}
            disabled={isTestingAPI}
          >
            {isTestingAPI ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.testAPIButtonIcon}>🔍</Text>
                <Text style={styles.testAPIButtonText}>
                  Test API Connection
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {renderMenuGrid()}
        {/* Test Shake Alert Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestShakeAlert}
        >
          <Text style={styles.testButtonText}>🚨 Test Shake Alert</Text>
        </TouchableOpacity>
        {/* {renderPendingTasks()} */}
      </ScrollView>
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Text>🏠</Text>
          <Text style={styles.bottomNavText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate('Service')}
        >
          <Text>⚙️</Text>
          <Text style={styles.bottomNavText}>Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate('SafeVault')}
        >
          <Text>🔒</Text>
          <Text style={styles.bottomNavText}>Safe Vault</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text>👤</Text>
          <Text style={styles.bottomNavText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  testButton: {
    backgroundColor: '#FF5722',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  apiTestSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4DB6AC',
  },
  apiInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  apiInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  apiInfoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4DB6AC',
  },
  apiInfoValueSmall: {
    fontSize: 11,
    color: '#666',
    maxWidth: '60%',
    textAlign: 'right',
  },
  testAPIButton: {
    backgroundColor: '#4DB6AC',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  testAPIButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  testAPIButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  testAPIButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4DB6AC',
  },
  backButton: {
    fontSize: 24,
    color: '#fff',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#4DB6AC',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#4DB6AC',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: '#E0E0E0',
    fontSize: 16,
  },
  activeTabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  menuItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  taskContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskCount: {
    flex: 1,
  },
  criticalBadge: {
    backgroundColor: '#FF5252',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  criticalText: {
    color: '#fff',
    fontSize: 12,
  },
  taskNumber: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskList: {
    marginTop: 8,
  },
  taskItem: {
    marginBottom: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
  },
  bottomNavText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default HomeScreen;

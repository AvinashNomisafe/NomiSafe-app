import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>NOMISAFE</Text>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your"
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
        <Text style={styles.activeTabText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabButton}>
        <Text style={styles.tabText}>Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

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

  const renderPendingTasks = () => (
    <View style={styles.taskContainer}>
      <Text style={styles.sectionTitle}>Pending Task</Text>
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskCount}>⚪ Action Pending</Text>
          <View style={styles.criticalBadge}>
            <Text style={styles.criticalText}>Critical Action</Text>
          </View>
          <Text style={styles.taskNumber}>5</Text>
        </View>
        <View style={styles.taskList}>
          <Text style={styles.taskItem}>• Add Nominee Details</Text>
          <Text style={styles.taskItem}>• LIC Renewal</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* {renderHeader()} */}
      <ScrollView style={styles.scrollView}>
        {renderSearchBar()}
        {renderTabButtons()}
        {renderMenuGrid()}
        {renderPendingTasks()}
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

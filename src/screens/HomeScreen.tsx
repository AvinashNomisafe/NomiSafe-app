import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const menuItems = [
    {
      id: 1,
      title: 'My Policy',
      icon: require('../assets/icons/policy_icon.png'),
      route: 'MyPolicy' as keyof RootStackParamList,
    },
    {
      id: 2,
      title: 'Insurance',
      icon: require('../assets/icons/insurance_icon.png'),
      route: 'Insurance' as keyof RootStackParamList,
    },
    {
      id: 3,
      title: 'Properties',
      icon: require('../assets/icons/properties_icon.png'),
      route: 'Properties' as keyof RootStackParamList,
    },
    {
      id: 4,
      title: 'Tutorials',
      icon: require('../assets/icons/tutorials_icon.png'),
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
          <Image
            source={item.icon}
            style={styles.menuIconImage}
            resizeMode="contain"
          />
          <Text style={styles.menuTitle}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>{renderMenuGrid()}</ScrollView>
      <BottomNavigation />
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
  menuIconImage: {
    width: 70,
    height: 70,
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
});

export default HomeScreen;

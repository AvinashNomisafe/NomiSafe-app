import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { getTutorials, TutorialItem } from '../services/tutorial';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const TutorialsScreen = () => {
  const [tutorials, setTutorials] = useState<TutorialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTutorials = async () => {
    try {
      setIsLoading(true);
      const data = await getTutorials();
      data.tutorials.forEach(tutorial => {
        console.log('Tutorial thumbnail URL:', tutorial.thumbnail_url);
      });
      setTutorials(data.tutorials);
    } catch (error) {
      console.error('Failed to load tutorials:', error);
      Alert.alert('Error', 'Failed to load tutorials');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTutorials();
    }, []),
  );

  const handlePlayPress = (youtubeUrl: string) => {
    Linking.openURL(youtubeUrl).catch(() => {
      Alert.alert('Error', 'Unable to open video');
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.background.main} />
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {tutorials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tutorials available</Text>
          </View>
        ) : (
          <View style={styles.tutorialsContainer}>
            {tutorials.map((tutorial, index) => (
              <TouchableOpacity
                key={tutorial.id}
                style={styles.tutorialCard}
                onPress={() => handlePlayPress(tutorial.youtube_url)}
                activeOpacity={0.85}
              >
                <View style={styles.cardContent}>
                  {/* Thumbnail with Play Button */}
                  <View style={styles.thumbnailContainer}>
                    <Image
                      source={{ uri: tutorial.thumbnail_url }}
                      style={styles.thumbnail}
                    />

                    {/* Play Button Overlay */}
                    <View style={styles.playButtonOverlay}>
                      <View style={styles.playButton}>
                        <Icon name="play" size={24} color="#fff" />
                      </View>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.textContent}>
                    <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                    <Text style={styles.tutorialDescription} numberOfLines={2}>
                      {tutorial.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    backgroundColor: colors.background.white,
  },
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  screenTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    minHeight: 300,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  tutorialsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  tutorialCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    position: 'relative',
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: '#E0E0E0',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    padding: spacing.md,
  },
  tutorialTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tutorialDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

export default TutorialsScreen;

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../constants/theme';
import { getVideoConfig, VideoConfig } from '../services/tutorial';

interface VideoSectionProps {
  videoUrl?: string;
}

const DEFAULT_VIDEO_URL = 'https://www.youtube.com/watch?v=VIDEO_ID';

const VideoSection: React.FC<VideoSectionProps> = ({
  videoUrl = DEFAULT_VIDEO_URL,
}) => {
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVideoConfig();
  }, []);

  const loadVideoConfig = async () => {
    try {
      setIsLoading(true);
      const data = await getVideoConfig();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load video config:', error);
      // Fallback to default if loading fails
      setConfig({
        title: 'How we secure your family future',
        subtitle:
          "Securely track assets, policies, and investments to protect your family's future.",
        youtube_url: videoUrl,
        updated_at: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    const url = config?.youtube_url || videoUrl;
    Linking.openURL(url).catch(() => undefined);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.background.main} />
      </View>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.subtitle}>{config.subtitle}</Text>

      <TouchableOpacity
        style={styles.videoCard}
        activeOpacity={0.85}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Play video"
      >
        <Image
          source={require('../assets/images/videoSectionImage.jpg')}
          style={styles.videoImage}
          resizeMode="cover"
        />
        <View style={styles.playButton}>
          <View style={styles.playTriangle} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EAF9E0',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  videoCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#6E7780',
    ...shadows.md,
  },
  videoImage: {
    width: '100%',
    height: 190,
  },
  playButton: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -28 }],
  },
  playTriangle: {
    width: 0,
    height: 0,
    marginLeft: 3,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#B0B6BD',
  },
});

export default VideoSection;

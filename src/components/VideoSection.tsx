import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../constants/theme';

interface VideoSectionProps {
  videoUrl?: string;
}

const DEFAULT_VIDEO_URL = 'https://www.youtube.com/watch?v=VIDEO_ID';

const VideoSection: React.FC<VideoSectionProps> = ({
  videoUrl = DEFAULT_VIDEO_URL,
}) => {
  const handlePress = () => {
    Linking.openURL(videoUrl).catch(() => undefined);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How we secure your family future</Text>
      <Text style={styles.subtitle}>
        Securely track assets, policies, and investments to protect your
        family's future.
      </Text>

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

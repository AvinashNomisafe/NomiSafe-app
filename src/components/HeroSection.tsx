import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, typography } from '../constants/theme';

interface HeroSectionProps {}

const ROTATING_TEXTS = [
  'Health Insurance',
  'Life Insurance',
  'Car Insurance',
  'Term Insurance',
];

const ROTATION_INTERVAL = 3000; // 3 seconds

const HeroSection: React.FC<HeroSectionProps> = ({}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out and slide up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update text
        setCurrentIndex(prev => (prev + 1) % ROTATING_TEXTS.length);

        // Reset position and fade in
        slideAnim.setValue(20);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [fadeAnim, slideAnim]);

  return (
    <LinearGradient
      colors={['#139DA4', '#5DBFC4', '#A8E2E5']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Main Title */}
      <Text style={styles.mainTitle}>Manage all your</Text>

      {/* Rotating Text */}
      <View style={styles.rotatingTextContainer}>
        <Animated.Text
          style={[
            styles.rotatingText,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {ROTATING_TEXTS[currentIndex]}
        </Animated.Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Nomisafe secures your family's future by storing policies, connecting
        nominees, and sending timely alerts.
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingBottom: 110,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 0,
  },
  mainTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.normal,
    color: colors.common.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  rotatingTextContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  rotatingText: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.common.white, // Slightly yellowish white for contrast
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.common.white,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.common.white,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginRight: 8,
  },
});

export default HeroSection;

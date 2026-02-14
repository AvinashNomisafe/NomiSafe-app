import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../constants/theme';

interface FirstConnectCTAProps {
  onAddPress?: () => void;
}

const FirstConnectCTA: React.FC<FirstConnectCTAProps> = ({ onAddPress }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/icons/firstConnectIcon.png')}
        style={styles.backgroundIcon}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        Add Your <Text style={styles.titleAccent}>First Connect</Text>
      </Text>

      <Text style={styles.description}>
        This is the person Nomisafe will notify first during an{' '}
        <Text style={styles.emphasis}>emergency.</Text>
      </Text>
      <Text style={styles.description}>
        Add someone you trust family, friend, or guardian.
      </Text>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={onAddPress}
        accessibilityRole="button"
        accessibilityLabel="Add first connect"
      >
        <Text style={styles.buttonText}>+ADD FIRST CONNECT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#CFE9EA',
    borderRadius: 4,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.sm,
    width: '95%',
    marginHorizontal: 'auto',
    marginTop: spacing.lg,
  },
  backgroundIcon: {
    position: 'absolute',
    right: 200,
    top: 40,
    width: 170,
    height: 170,
    opacity: 0.05,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleAccent: {
    color: colors.background.main,
    fontWeight: typography.fontWeight.normal,
  },
  description: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emphasis: {
    color: colors.secondary.coral,
    fontWeight: typography.fontWeight.medium,
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: '#139DA4',
    paddingVertical: 14,
    paddingHorizontal: spacing['3xl'],
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.common.white,
    letterSpacing: 0.7,
  },
});

export default FirstConnectCTA;

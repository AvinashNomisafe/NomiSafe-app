/**
 * SummaryCard Component
 * Reusable summary card for dashboard statistics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  iconSizes,
} from '../../constants/theme';

interface SummaryCardProps {
  iconName: string;
  value: string | number;
  label: string;
  backgroundColor?: string;
  iconColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  iconName,
  value,
  label,
  backgroundColor = colors.primary.main,
  iconColor = colors.common.white,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <MaterialCommunityIcons
        name={iconName}
        size={iconSizes.lg}
        color={iconColor}
      />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  value: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.common.white,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.common.white,
    opacity: 0.9,
  },
});

export default SummaryCard;

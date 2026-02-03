/**
 * EmptyState Component
 * Reusable empty state display with icon and message
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, iconSizes } from '../../constants/theme';

interface EmptyStateProps {
  iconName?: string;
  message?: string;
  iconSize?: number;
  iconColor?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'chart-box-outline',
  message = 'No data available',
  iconSize = iconSizes['2xl'],
  iconColor = colors.text.hint,
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={iconName}
        size={iconSize}
        color={iconColor}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    color: colors.text.disabled,
  },
});

export default EmptyState;

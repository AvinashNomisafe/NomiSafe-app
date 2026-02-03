/**
 * TabToggle Component
 * Reusable tab toggle for switching between views
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

interface Tab {
  value: string;
  label: string;
}

interface TabToggleProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
}

const TabToggle: React.FC<TabToggleProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <View style={styles.container}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.value}
          style={[
            styles.button,
            activeTab === tab.value && styles.buttonActive,
          ]}
          onPress={() => onChange(tab.value)}
        >
          <Text
            style={[
              styles.buttonText,
              activeTab === tab.value && styles.buttonTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.common.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  buttonActive: {
    backgroundColor: colors.primary.main,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  buttonTextActive: {
    color: colors.common.white,
  },
});

export default TabToggle;

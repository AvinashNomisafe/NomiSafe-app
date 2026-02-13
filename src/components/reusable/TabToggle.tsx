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
    marginTop: -40,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#139DA4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: '#F2F3F4',
  },
  buttonActive: {
    backgroundColor: colors.background.main,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.black,
  },
  buttonTextActive: {
    color: colors.common.white,
  },
});

export default TabToggle;

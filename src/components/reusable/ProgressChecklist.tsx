/**
 * ProgressChecklist Component
 * Reusable checklist with progress bar for onboarding/tasks
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  iconSizes,
} from '../../constants/theme';

interface ChecklistItem {
  id: number | string;
  text: string;
  completed: boolean;
  route?: string;
}

interface ProgressChecklistProps {
  title?: string;
  sectionTitle?: string;
  items: ChecklistItem[];
  onItemPress: (item: ChecklistItem) => void;
}

const ProgressChecklist: React.FC<ProgressChecklistProps> = ({
  title = 'Pending Tasks',
  sectionTitle = 'Getting Started',
  items,
  onItemPress,
}) => {
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.section}>
        {/* Section Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="check-circle"
            size={iconSizes.md}
            color={colors.primary.main}
          />
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        </View>

        {/* Checklist Items */}
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, index === items.length - 1 && styles.itemLast]}
            onPress={() => onItemPress(item)}
            disabled={item.completed}
          >
            <View
              style={[
                styles.itemIcon,
                item.completed
                  ? styles.itemIconComplete
                  : styles.itemIconIncomplete,
              ]}
            >
              {item.completed && (
                <MaterialCommunityIcons
                  name="check"
                  size={iconSizes.xs}
                  color={colors.common.white}
                />
              )}
            </View>
            <Text
              style={[
                styles.itemText,
                item.completed && styles.itemTextComplete,
              ]}
            >
              {item.text}
            </Text>
            {!item.completed && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={iconSizes.sm}
                color={colors.text.disabled}
              />
            )}
          </TouchableOpacity>
        ))}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            {completedCount} of {totalCount} steps completed
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.black,
    marginBottom: spacing.md,
  },
  section: {
    backgroundColor: colors.common.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.black,
    marginLeft: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.grey,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemIconComplete: {
    backgroundColor: colors.status.success,
  },
  itemIconIncomplete: {
    backgroundColor: colors.background.darkGrey,
  },
  itemText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  itemTextComplete: {
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  progressContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background.grey,
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.background.darkGrey,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.sm,
  },
});

export default ProgressChecklist;

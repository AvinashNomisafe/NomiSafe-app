/**
 * RenewalsList Component
 * Reusable list for displaying upcoming renewals
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
import { formatCurrency, formatDate } from '../../utils/formatters';

interface RenewalItem {
  id: number | string;
  name: string;
  insurer_name: string;
  premium_amount: number;
  days_remaining: number;
  end_date: string;
}

interface RenewalsListProps {
  renewals: RenewalItem[];
  onItemPress: (renewal: RenewalItem) => void;
  title?: string;
  iconName?: string;
  iconColor?: string;
}

const RenewalsList: React.FC<RenewalsListProps> = ({
  renewals,
  onItemPress,
  title = 'Upcoming Renewals',
  iconName = 'calendar-clock',
  iconColor = colors.status.warning,
}) => {
  if (!renewals || renewals.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={iconName}
          size={iconSizes.md}
          color={iconColor}
        />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Renewal Items */}
      {renewals.map(renewal => (
        <TouchableOpacity
          key={renewal.id}
          style={styles.item}
          onPress={() => onItemPress(renewal)}
        >
          <View style={styles.itemLeft}>
            <Text style={styles.itemName}>{renewal.name}</Text>
            <Text style={styles.itemInsurer}>{renewal.insurer_name}</Text>
            <Text style={styles.itemPremium}>
              Premium: {formatCurrency(renewal.premium_amount)}
            </Text>
          </View>
          <View style={styles.itemRight}>
            <View
              style={[
                styles.badge,
                renewal.days_remaining <= 30 && styles.badgeUrgent,
              ]}
            >
              <Text style={styles.badgeText}>
                {renewal.days_remaining} days
              </Text>
            </View>
            <Text style={styles.itemDate}>{formatDate(renewal.end_date)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.common.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.black,
    marginLeft: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.grey,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.black,
    marginBottom: spacing.xs,
  },
  itemInsurer: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  itemPremium: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: colors.status.success,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  badgeUrgent: {
    backgroundColor: colors.status.urgent,
  },
  badgeText: {
    color: colors.common.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
  },
  itemDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default RenewalsList;

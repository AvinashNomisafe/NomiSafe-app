/**
 * RecentPoliciesList Component
 * Reusable list for displaying recent policies
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
import { formatCurrency } from '../../utils/formatters';

interface PolicyItem {
  id: number | string;
  name: string;
  insurer_name: string;
  insurance_type: string;
  sum_assured: number;
}

interface RecentPoliciesListProps {
  policies: PolicyItem[];
  onItemPress: (policy: PolicyItem) => void;
  title?: string;
  iconName?: string;
  iconColor?: string;
}

const RecentPoliciesList: React.FC<RecentPoliciesListProps> = ({
  policies,
  onItemPress,
  title = 'Recent Policies',
  iconName = 'clock-outline',
  iconColor = colors.status.info,
}) => {
  if (!policies || policies.length === 0) {
    return null;
  }

  const getPolicyIcon = (insuranceType: string) => {
    switch (insuranceType) {
      case 'LIFE':
        return 'heart-pulse';
      case 'HEALTH':
        return 'medical-bag';
      case 'MOTOR':
        return 'car';
      default:
        return 'shield-outline';
    }
  };

  const getPolicyIconColor = (insuranceType: string) => {
    switch (insuranceType) {
      case 'LIFE':
        return colors.insurance.life;
      case 'HEALTH':
        return colors.insurance.health;
      case 'MOTOR':
        return '#FF9800'; // Orange for motor insurance
      default:
        return colors.primary.main;
    }
  };

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

      {/* Policy Items */}
      {policies.map(policy => (
        <TouchableOpacity
          key={policy.id}
          style={styles.item}
          onPress={() => onItemPress(policy)}
        >
          <View style={styles.itemLeft}>
            <View
              style={[
                styles.itemIcon,
                { backgroundColor: getPolicyIconColor(policy.insurance_type) },
              ]}
            >
              <MaterialCommunityIcons
                name={getPolicyIcon(policy.insurance_type)}
                size={iconSizes.sm}
                color={colors.common.white}
              />
            </View>
            <View>
              <Text style={styles.itemName}>{policy.name}</Text>
              <Text style={styles.itemInsurer}>{policy.insurer_name}</Text>
            </View>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemAmount}>
              {formatCurrency(policy.sum_assured)}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={iconSizes.md}
              color={colors.text.hint}
            />
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
    marginRight: spacing.sm,
  },
});

export default RecentPoliciesList;

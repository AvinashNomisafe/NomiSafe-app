/**
 * MenuGrid Component
 * Reusable grid menu for navigation items
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

interface MenuItem {
  id: number | string;
  title: string;
  icon: ImageSourcePropType;
  route: string;
}

interface MenuGridProps {
  items: MenuItem[];
  onItemPress: (route: string) => void;
  columns?: number;
}

const MenuGrid: React.FC<MenuGridProps> = ({
  items,
  onItemPress,
  columns = 4,
}) => {
  const itemWidth = `${100 / columns}%` as const;

  return (
    <View style={styles.container}>
      {items.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, { width: itemWidth as any }]}
          onPress={() => onItemPress(item.route)}
        >
          <Image source={item.icon} style={styles.icon} resizeMode="contain" />
          <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    backgroundColor: colors.common.white,
  },
  item: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    width: 70,
    height: 70,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    color: colors.text.primary,
  },
});

export default MenuGrid;
